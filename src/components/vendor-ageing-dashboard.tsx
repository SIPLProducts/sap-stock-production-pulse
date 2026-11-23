import { useId, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { TINTS } from "@/lib/card-tints";
import { BarList, Card, Donut, PlantColumns } from "@/components/open-po-dashboard";
import { datedFileName } from "@/lib/format";
import { isMsme, VA_BUCKETS, vaGroup, vaTotals, type VaRow } from "@/lib/vendor-ageing-data";

const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number, d = 2) => v.toLocaleString("en-IN", { maximumFractionDigits: d });
const ddmm = (iso: string) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "");
const PAGE = 50;
type Key = "vendor" | "bukrs" | "docType" | "prctr" | "gl" | "msme";
const EMPTY: Record<Key, string[] | null> = { vendor: null, bukrs: null, docType: null, prctr: null, gl: null, msme: null };
const ok = (sel: string[] | null, v: string) => sel === null || sel.includes(v);

function BucketChart({ data }: { data: number[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rows = VA_BUCKETS.map((name, i) => ({ name, value: (data[i] ?? 0) / CR }));
  return <div className="h-60"><ResponsiveContainer><BarChart data={rows} margin={{ top: 10, left: -4, right: 6 }}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--kpi-3)" stopOpacity={0.6} /><stop offset="100%" stopColor="var(--kpi-3)" /></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)" }} interval={0} />
    <YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} width={56} tickFormatter={(v: number) => v.toFixed(2)} />
    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} Cr`, "Outstanding"]} />
    <Bar dataKey="value" fill={`url(#${id})`} radius={[4, 4, 0, 0]} />
  </BarChart></ResponsiveContainer></div>;
}

export function VendorAgeingDashboard({ rows }: { rows: VaRow[] }) {
  const [f, setF] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const msmeLabel = (r: VaRow) => (isMsme(r) ? "MSME" : "Non-MSME");
  const opts = useMemo(() => {
    const pairs = (k: (r: VaRow) => string, l: (r: VaRow) => string) => [...new Map(rows.filter((r) => k(r)).map((r) => [k(r), l(r) && l(r) !== k(r) ? `${k(r)} - ${l(r)}` : k(r)]))].sort((a, b) => a[0].localeCompare(b[0])).map(([value, label]) => ({ value, label }));
    return { vendor: pairs((r) => r.vendor, (r) => r.vendorName), bukrs: pairs((r) => r.bukrs, () => ""), docType: pairs((r) => r.docType, () => ""), prctr: pairs((r) => r.prctr, (r) => r.prctrText), gl: pairs((r) => r.gl, (r) => r.glText), msme: pairs(msmeLabel, () => "") };
  }, [rows]);
  const data = useMemo(() => rows.filter((r) => ok(f.vendor, r.vendor) && ok(f.bukrs, r.bukrs) && ok(f.docType, r.docType) && ok(f.prctr, r.prctr) && ok(f.gl, r.gl) && ok(f.msme, msmeLabel(r))), [rows, f]);
  const t = vaTotals(data);
  const keyDate = rows.find((r) => r.keyDate)?.keyDate ?? "";
  const vendors = vaGroup(data, (r) => r.vendorName).slice(0, 10);
  const pcs = vaGroup(data, (r) => r.prctrText).slice(0, 10);
  const gls = vaGroup(data, (r) => r.glText).slice(0, 10);
  const segs = vaGroup(data, (r) => r.segment).slice(0, 10);
  const cos = vaGroup(data, (r) => r.bukrs).slice(0, 15).map((d) => ({ ...d, value: d.value / CR }));
  const msme = vaGroup(data, msmeLabel);
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
  const b = t.buckets;
  const tiles: [string, string, string][] = [
    ["Total Outstanding", cr(t.total), "#1f6fd1"],
    ["0-30 Days", cr(b[0]!), "#0f9d8a"],
    ["31-180 Days", cr(b[1]! + b[2]! + b[3]!), "#e0a030"],
    ["181-365 Days", cr(b[4]!), "#e07b39"],
    ["> 1 Year", cr(b[5]! + b[6]! + b[7]! + b[8]!), "#d64550"],
    ["MSME Outstanding", cr(t.msme), "#7b4fd6"],
    ["Vendors", num(t.vendors, 0), "#2f8f4e"],
  ];

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters{keyDate ? <span className="ml-2 font-normal text-muted-foreground">Key Date: {ddmm(keyDate)}</span> : null}</span><ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} /></button>
      {open ? <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:grid-cols-4 lg:grid-cols-7">{field("vendor", "Vendor")}{field("bukrs", "Company Code")}{field("docType", "Document Type")}{field("prctr", "Profit Center")}{field("gl", "G/L Account")}{field("msme", "MSME")}
        <div className="flex items-end"><Button type="button" variant="reset" size="sm" className="h-8 w-full text-xs" onClick={() => { setF(EMPTY); setPage(0); }}>Reset</Button></div></div> : null}
    </div>
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
      {tiles.map(([label, value, tone]) => <div key={label} className="min-w-0 rounded-xl px-2.5 py-2 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, ${tone}cc, ${tone})` }}>
        <p className="text-[10px] font-semibold opacity-95">{label}</p>
        <p title={value} className="mt-1 truncate text-sm font-bold tabular-nums leading-tight sm:text-base">{value}</p></div>)}
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
      <Card title="Ageing Buckets" sub="Val in Cr" tint="sky"><BucketChart data={t.buckets} /></Card>
      <Card title="MSME vs Non-MSME" sub="Val in Cr" tint="peach"><Donut data={msme} heads={["Type", "Val", "%"]} /></Card>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card title="Top 10 Vendors" sub="Val in Cr" tint="teal"><BarList data={vendors} /></Card>
      <Card title="Top 10 Profit Centers" sub="Val in Cr" tint="amber"><BarList data={pcs} /></Card>
      <Card title="By G/L Account" sub="Val in Cr" tint="rose"><BarList data={gls} /></Card>
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
      <div className="mt-2 flex items-center gap-2 text-[11px]"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button><span>Page {page + 1} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></div>
    </Card></div>
  </div>;
}
