import { useMemo, useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { TINTS } from "@/lib/card-tints";
import { BarList, Card, Donut, PlantColumns } from "@/components/open-po-dashboard";
import { datedFileName } from "@/lib/format";
import { isMsme, rebucketByBasis, VA_BUCKETS, vaGlDocSplit, vaGroup, vaGroupSplit, vaMsmeClass, vaTotals, type VaBasis, type VaRow } from "@/lib/vendor-ageing-data";

const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number, d = 2) => v.toLocaleString("en-IN", { maximumFractionDigits: d });
const ddmm = (iso: string) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "");
const PAGE_SIZES = [50, 100, 250, 500];
type Key = "vendor" | "bukrs" | "docType" | "prctr" | "pcText" | "gl" | "msme";
const EMPTY: Record<Key, string[] | null> = { vendor: null, bukrs: null, docType: null, prctr: null, pcText: null, gl: null, msme: null };
const BASES: [VaBasis, string][] = [["all", "All"], ["due", "Due Date"], ["post", "Posting Date"], ["grn", "GRN Date"]];
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const ok = (sel: string[] | null, v: string) => sel === null || sel.includes(v);

export function VendorAgeingDashboard({ rows }: { rows: VaRow[] }) {
  const [f, setF] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [basis, setBasis] = useState<VaBasis>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [PAGE, setPageSize] = useState(50);
  const msmeLabel = (r: VaRow) => (isMsme(r) ? "MSME" : "Non-MSME");
  const opts = useMemo(() => {
    const pairs = (k: (r: VaRow) => string, l: (r: VaRow) => string) => [...new Map(rows.filter((r) => k(r)).map((r) => [k(r), l(r) && l(r) !== k(r) ? `${k(r)} - ${l(r)}` : k(r)]))].sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label }));
    return { vendor: pairs((r) => r.vendor, (r) => r.vendorName), bukrs: pairs((r) => r.bukrs, () => ""), docType: pairs((r) => r.docType, () => ""), prctr: pairs((r) => r.prctr, (r) => r.prctrText), pcText: pairs((r) => r.prctrText, () => ""), gl: pairs((r) => r.gl, (r) => r.glText), msme: pairs(msmeLabel, () => "") };
  }, [rows]);
  const keyDate = rows.find((r) => r.keyDate)?.keyDate ?? "";
  const data = useMemo(() => {
    const from = range?.from ? iso(range.from) : "", to = range?.to ? iso(range.to) : from;
    const base = rows.filter((r) => ok(f.vendor, r.vendor) && ok(f.bukrs, r.bukrs) && ok(f.docType, r.docType) && ok(f.prctr, r.prctr) && ok(f.pcText, r.prctrText) && ok(f.gl, r.gl) && ok(f.msme, msmeLabel(r)) && (!from || (r.postDate >= from && r.postDate <= to)));
    return rebucketByBasis(base, basis, keyDate);
  }, [rows, f, range, basis, keyDate]);
  const t = vaTotals(data);
  const topPay = vaGroupSplit(data, (r) => r.vendorName, "payable").slice(0, 10);
  const topAdv = vaGroupSplit(data, (r) => r.vendorName, "advance").slice(0, 10);
  const topPc = vaGroupSplit(data, (r) => r.prctrText, "payable").slice(0, 10);
  const glSplit = vaGlDocSplit(data);
  const segs = vaGroup(data, (r) => r.segment).slice(0, 10);
  const cos = vaGroup(data, (r) => r.bukrs).slice(0, 15).map((d) => ({ ...d, value: d.value / CR }));
  const msme = vaGroupSplit(data, vaMsmeClass, "payable");
  const table = data.filter((r) => !q || `${r.vendor} ${r.vendorName} ${r.doc} ${r.docType} ${r.bukrs} ${r.prctr} ${r.prctrText} ${r.gl} ${r.glText} ${r.ref} ${r.text} ${r.po}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.days - a.days);
  const tt = vaTotals(table);
  const pages = Math.max(1, Math.ceil(table.length / PAGE));
  const HEADS = ["Vendor", "Vendor Name", "PAN", "MSME", "Doc No", "Doc Type", "Doc Date", "Posting Date", "Due Date", "Days", "Company", "Profit Center", "PC Text", "G/L", "G/L Text", "Segment", "Reference", "Text", "Amount (₹)", ...VA_BUCKETS.map((b) => `${b} (₹)`)];
  const cells = (r: VaRow): (string | number)[] => [r.vendor, r.vendorName, r.pan, r.msmeDesc, r.doc, r.docType, ddmm(r.docDate), ddmm(r.postDate), ddmm(r.dueDate), r.days, r.bukrs, r.prctr, r.prctrText, r.gl, r.glText, r.segment, r.ref, r.text, r.amount, ...r.buckets];
  const exportXlsx = async () => {
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const ws = wb.addWorksheet("Vendor Ageing");
    ws.addRow(HEADS).font = { bold: true };
    table.forEach((r) => ws.addRow(cells(r)));
    ws.addRow(["Total", ...Array(17).fill(""), tt.total, ...tt.buckets]).font = { bold: true };
    const blob = new Blob([await wb.xlsx.writeBuffer()]); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = datedFileName("Vendor Ageing", "xlsx"); a.click(); URL.revokeObjectURL(a.href);
  };
  const field = (k: Key, label: string) => <FilterMultiSelect label={label} placeholder="All" selected={f[k]} options={opts[k]} onChange={(v) => { setF({ ...f, [k]: v.length === opts[k].length ? null : v }); setPage(0); }} />;
  const tiles: [string, string, string, string][] = [
    ["Total Outstanding", `₹ ${cr(t.total)} Cr`, `Across ${num(t.vendors, 0)} Vendors`, "#1f6fd1"],
    ["Net Payable", `₹ ${cr(t.payable)} Cr`, "Credit Balance", "#0f8a8a"],
    ["Vendor Advances", `₹ ${cr(t.advances)} Cr`, "Debit / Unadjusted", "#7b4fd6"],
    ["MSME Overdue (>45 Days)", `₹ ${cr(t.msmeOverdue45)} Cr`, "Critical Compliance Alert", "#d1453b"],
  ];
  const SEG = ["var(--kpi-1)", "var(--kpi-2)", "var(--kpi-3)", "var(--kpi-4)", "var(--kpi-6)"];
  const glMax = Math.max(1, ...glSplit.rows.map((g) => g.total));

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters{keyDate ? <span className="ml-2 font-normal text-muted-foreground">Key Date: {ddmm(keyDate)}</span> : null}</span><ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} /></button>
      {open ? <div className="space-y-2 px-3 pb-2"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
        <div className="col-span-2 flex min-w-0 flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground">Posting Date</span><Popover><PopoverTrigger asChild><Button type="button" variant="outline" size="sm" className={`h-8 w-full justify-start text-xs font-normal ${range?.from ? "" : "text-muted-foreground"}`}><CalendarIcon className="size-3.5" />{range?.from ? `${format(range.from, "dd-MM-yyyy")}${range.to ? ` – ${format(range.to, "dd-MM-yyyy")}` : ""}` : "All dates"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={range} onSelect={(v) => { setRange(v); setPage(0); }} numberOfMonths={2} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover></div>
        {field("vendor", "Vendor")}{field("bukrs", "Company Code")}{field("docType", "Document Type")}{field("prctr", "Profit Center")}{field("pcText", "Profit Center Text")}{field("gl", "G/L Account")}{field("msme", "MSME")}
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setRange(undefined); setBasis("all"); setPage(0); }}>Reset</Button></div></div>
        <div className="flex flex-wrap items-center gap-3 text-xs"><span className="font-medium text-muted-foreground">Age basis</span><RadioGroup value={basis} onValueChange={(v) => { setBasis(v as VaBasis); setPage(0); }} className="flex flex-wrap gap-4">{BASES.map(([v, l]) => <div key={v} className="flex items-center gap-1.5"><RadioGroupItem value={v} id={`va-basis-${v}`} /><Label htmlFor={`va-basis-${v}`} className="text-xs">{l}</Label></div>)}</RadioGroup>{basis === "grn" ? <span className="text-muted-foreground">No GRN date in data</span> : null}</div></div> : null}
    </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(([label, value, note, tone]) => <div key={label} className="min-w-0 rounded-xl px-2.5 py-2 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, ${tone}cc, ${tone})` }}>
        <p className="text-[10px] font-semibold opacity-95">{label}</p>
        <p title={value} className="mt-1 truncate text-sm font-bold tabular-nums leading-tight sm:text-base">{value}</p><p className="text-[10px] opacity-90">{note}</p></div>)}
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Ageing Buckets" sub="Val in Cr" tint="sky"><Donut data={VA_BUCKETS.map((name, i) => ({ name, value: t.buckets[i] ?? 0 })).filter((d) => d.value > 0)} heads={["Bucket", "Val", "%"]} /></Card>
      <Card title="MSME vs Non-MSME Exposure" sub="Val in Cr" tint="peach"><Donut data={msme} heads={["Type", "Val", "%"]} /></Card>
      <Card title="GL Account & Document Type Split" sub="Payable · Val in Cr" tint="rose">
        <div className="space-y-2">{glSplit.rows.map((g) => <div key={g.name} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-[11px]"><span title={g.name} className="truncate">{g.name}</span>
          <div className="flex h-4 overflow-hidden rounded bg-muted" style={{ width: `${(g.total / glMax) * 100}%` }}>{glSplit.keys.map((k, i) => (g.parts[k] ?? 0) > 0 ? <div key={k} title={`${k}: ₹ ${cr(g.parts[k] ?? 0)} Cr`} style={{ width: `${((g.parts[k] ?? 0) / g.total) * 100}%`, background: SEG[i] }} /> : null)}</div>
          <span className="tabular-nums">₹ {cr(g.total)}</span></div>)}
          {glSplit.rows.length ? <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-muted-foreground">{glSplit.keys.map((k, i) => <span key={k} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: SEG[i] }} />{k}</span>)}</div> : <p className="text-xs text-muted-foreground">No data</p>}</div></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card title="Top 10 Vendors by Payable" sub="Val in Cr" tint="teal"><BarList data={topPay} /></Card>
      <Card title="Top 10 Vendors by Advance" sub="Val in Cr" tint="sky"><BarList data={topAdv} /></Card>
      <Card title="Top 10 Profit Centers" sub="Val in Cr" tint="amber"><BarList data={topPc} /></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card title="Outstanding by Company Code" sub="Val in Cr" tint="copper"><PlantColumns data={cos} /></Card>
      <Card title="By Segment" sub="Val in Cr" tint="neutral"><BarList data={segs} /></Card>
    </div>
    <div data-pdf-exclude><Card title="Vendor Ageing Details" tint="neutral">
      <div className="mb-2 flex flex-wrap items-center gap-2"><input className="h-8 w-60 rounded-md border border-border bg-background px-2 text-xs" placeholder="Search vendor, document, G/L…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /><Button size="sm" variant="outline" onClick={exportXlsx}>Excel</Button><span className="text-[11px] text-muted-foreground">{table.length} lines</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[2400px] text-[11px]"><thead><tr className="border-b text-left">{HEADS.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
        <tbody>{table.slice(page * PAGE, page * PAGE + PAGE).map((r, i) => <tr key={i} className="border-b border-border/50">{cells(r).map((v, j) => <td key={j} className={`whitespace-nowrap px-2 py-1 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{typeof v === "number" ? num(v) : v}</td>)}</tr>)}</tbody>
        <tfoot><tr className="border-t-2 border-border font-bold"><td className="px-2 py-1.5" colSpan={18}>Total ({table.length} lines)</td>{[tt.total, ...tt.buckets].map((v, i) => <td key={i} className="px-2 py-1.5 text-right tabular-nums">{num(v)}</td>)}</tr></tfoot></table></div>
      <div className="mt-2 flex items-center gap-2 text-[11px]"><label className="flex items-center gap-1 text-muted-foreground">Rows per page<select className="h-8 rounded-md border border-border bg-background px-1.5 text-xs text-foreground" value={PAGE} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}>{PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}</select></label><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button><span>Page {page + 1} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></div>
    </Card></div>
  </div>;
}
