import { BrandLoader } from "@/components/brand-loader";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TINTS } from "@/lib/card-tints";
import { BarList, Card, Donut, PlantColumns } from "@/components/open-po-dashboard";
import { datedFileName } from "@/lib/format";
import { activeFilters, getZfPage, zfOptionsQuery, zfSummaryQuery, ZF_EMPTY, type ZfFilters, type ZfRow, type ZfSummary } from "@/lib/zfbl1n-data";

const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (v: number, d = 2) => v.toLocaleString("en-IN", { maximumFractionDigits: d });
const ddmm = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "");
const PAGE = 50;
const TYPES: [string, string][] = [["normal", "Normal items"], ["special", "Special G/L transactions"], ["noted", "Noted items"], ["parked", "Parked items"], ["customer", "Customer items"]];
const STATUS: [ZfFilters["status"], string][] = [["open", "Open items"], ["cleared", "Cleared items"], ["all", "All items"]];
const HEADS = ["Company", "Vendor", "Vendor Name", "Doc No", "Item", "Doc Type", "Posting Date", "Doc Date", "Due Date", "Days in Arrears", "Profit Center", "G/L", "G/L Text", "Assignment", "Text", "Clearing Doc", "Clearing Date", "Currency", "Amount (₹)"];
const cells = (r: ZfRow): (string | number)[] => [r.bukrs, r.lifnr, r.name1 ?? "", r.belnr, r.buzei, r.blart, ddmm(r.budat), ddmm(r.bldat), ddmm(r.faedt), r.verzn ?? 0, r.prctr ?? "", r.hkont ?? "", r.txt50 ?? "", r.zuonr ?? "", r.sgtxt ?? "", r.augbl ?? "", ddmm(r.augdt), r.waers ?? "", Number(r.dmshb) || 0];

function Sel({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return <label className="flex min-w-0 flex-col gap-1"><span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    <select className="h-8 w-full min-w-0 rounded-md border border-border bg-background px-2 text-xs" value={value} onChange={(e) => onChange(e.target.value)}><option value="">All</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
}

export function Zfbl1nDashboard() {
  const [f, setF] = useState<ZfFilters>(ZF_EMPTY);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const af = activeFilters(f);
  const opts = useQuery(zfOptionsQuery).data ?? { vendors: [], bukrs: [], prctr: [] };
  const sum = useQuery({ ...zfSummaryQuery(af), placeholderData: keepPreviousData });
  const tbl = useQuery({ queryKey: ["zfbl1n", "page", af, q, page], queryFn: () => getZfPage(af, q, page * PAGE, PAGE), placeholderData: keepPreviousData, staleTime: Infinity, refetchOnWindowFocus: false });
  const set = (p: Partial<ZfFilters>) => { setF({ ...f, ...p }); setPage(0); };
  const range: DateRange | undefined = f.post_from ? { from: new Date(f.post_from), ...(f.post_to ? { to: new Date(f.post_to) } : {}) } : undefined;
  const s: ZfSummary | undefined = sum.data;
  const exportXlsx = async () => {
    const all = await getZfPage(af, q, 0, 100000);
    const { Workbook } = await import("exceljs");
    const wb = new Workbook(); const ws = wb.addWorksheet("ZFBL1N");
    ws.addRow(HEADS).font = { bold: true };
    all.rows.forEach((r) => ws.addRow(cells(r)));
    ws.addRow(["Total", ...Array(HEADS.length - 2).fill(""), all.sum]).font = { bold: true };
    const blob = new Blob([await wb.xlsx.writeBuffer()]); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = datedFileName("ZFBL1N", "xlsx"); a.click(); URL.revokeObjectURL(a.href);
  };
  const tiles: [string, string, string, string][] = s ? [
    ["Net Balance", `₹ ${cr(Math.abs(s.net))} Cr`, s.net < 0 ? "Credit (payable)" : "Debit", "#1f6fd1"],
    ["Debit", `₹ ${cr(s.debit)} Cr`, "Payments / advances", "#0f8a8a"],
    ["Credit", `₹ ${cr(s.credit)} Cr`, "Invoices / liabilities", "#7b4fd6"],
    ["Overdue", `₹ ${cr(s.overdue)} Cr`, "Past due date", "#d1453b"],
    ["Vendors", num(s.vendors, 0), "Distinct vendors", "#c27a12"],
    ["Line Items", num(s.lines, 0), "Documents lines", "#3b7d3b"],
  ] : [];
  const pages = Math.max(1, Math.ceil((tbl.data?.total ?? 0) / PAGE));

  return <div className="space-y-3">
    <div data-pdf-exclude className="rounded-xl border border-border shadow-sm" style={TINTS.neutral}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-card-foreground"><span>Filters</span><ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} /></button>
      {open ? <div className="space-y-3 px-3 pb-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <div className="col-span-2 flex min-w-0 flex-col gap-1 lg:col-span-1"><span className="text-[11px] font-medium text-muted-foreground">Posting Date</span><Popover><PopoverTrigger asChild><Button type="button" variant="outline" size="sm" className={`h-8 w-full justify-start text-xs font-normal ${range?.from ? "" : "text-muted-foreground"}`}><CalendarIcon className="size-3.5" />{f.post_from ? `${ddmm(f.post_from)}${f.post_to ? ` – ${ddmm(f.post_to)}` : ""}` : "All dates"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={range} onSelect={(v) => set({ post_from: v?.from ? format(v.from, "yyyy-MM-dd") : "", post_to: v?.to ? format(v.to, "yyyy-MM-dd") : "" })} numberOfMonths={2} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover></div>
          <Sel label="Vendor account" value={f.vendor_from} options={opts.vendors} onChange={(v) => set({ vendor_from: v })} />
          <Sel label="to" value={f.vendor_to} options={opts.vendors} onChange={(v) => set({ vendor_to: v })} />
          <Sel label="Company code" value={f.bukrs_from} options={opts.bukrs} onChange={(v) => set({ bukrs_from: v })} />
          <Sel label="to" value={f.bukrs_to} options={opts.bukrs} onChange={(v) => set({ bukrs_to: v })} />
          <Sel label="Profit Center" value={f.prctr_from} options={opts.prctr} onChange={(v) => set({ prctr_from: v })} />
          <Sel label="to" value={f.prctr_to} options={opts.prctr} onChange={(v) => set({ prctr_to: v })} />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span className="font-medium text-muted-foreground">Status</span>
          <RadioGroup value={f.status} onValueChange={(v) => set({ status: v as ZfFilters["status"] })} className="flex flex-wrap gap-4">{STATUS.map(([v, l]) => <div key={v} className="flex items-center gap-1.5"><RadioGroupItem value={v} id={`zf-st-${v}`} /><Label htmlFor={`zf-st-${v}`} className="text-xs">{l}</Label></div>)}</RadioGroup>
          {f.status === "open" ? <label className="flex items-center gap-1.5"><span className="text-muted-foreground">Open at key date</span><input type="date" className="h-7 rounded-md border border-border bg-background px-2 text-xs" value={f.key_date} onChange={(e) => set({ key_date: e.target.value })} /></label> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"><span className="font-medium text-muted-foreground">Type</span>
          {TYPES.map(([v, l]) => <div key={v} className="flex items-center gap-1.5"><Checkbox id={`zf-ty-${v}`} checked={f.types.includes(v)} onCheckedChange={(c) => set({ types: c ? [...f.types, v] : f.types.filter((x) => x !== v) })} /><Label htmlFor={`zf-ty-${v}`} className="text-xs">{l}</Label></div>)}
          <Button type="button" variant="reset" size="sm" className="ml-auto h-8 text-xs" onClick={() => { setF(ZF_EMPTY); setPage(0); }}>Reset</Button></div>
      </div> : null}
    </div>
    {sum.error ? <p className="text-sm text-destructive">{(sum.error as Error).message}</p> : !s ? <BrandLoader inline label="Loading ZFBL1N…" /> : <>
      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 ${sum.isFetching ? "opacity-70" : ""}`}>
        {tiles.map(([label, value, note, tone]) => <div key={label} className="min-w-0 rounded-xl px-2.5 py-2 text-primary-foreground shadow-md" style={{ background: `linear-gradient(135deg, ${tone}cc, ${tone})` }}>
          <p className="text-[10px] font-semibold opacity-95">{label}</p><p title={value} className="mt-1 truncate text-sm font-bold tabular-nums leading-tight sm:text-base">{value}</p><p className="text-[10px] opacity-90">{note}</p></div>)}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Overdue vs Not Due" sub="Val in Cr" tint="peach"><Donut data={[{ name: "Overdue", value: s.overdue }, { name: "Not Due", value: s.notDue }].filter((d) => d.value > 0)} heads={["Status", "Val", "%"]} /></Card>
        <Card title="Arrears Buckets" sub="Days in arrears · Val in Cr" tint="sky"><Donut data={s.buckets.filter((d) => d.value > 0)} heads={["Bucket", "Val", "%"]} /></Card>
        <Card title="Document Type Split" sub="Val in Cr" tint="rose"><Donut data={s.docTypes.slice(0, 8)} heads={["Doc Type", "Val", "%"]} /></Card>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card title="Top 10 Vendors" sub="Val in Cr" tint="teal"><BarList data={s.vendorsTop} /></Card>
        <Card title="Top 10 Profit Centers" sub="Val in Cr" tint="amber"><BarList data={s.pcTop} /></Card>
        <Card title="Top 10 G/L Accounts" sub="Val in Cr" tint="neutral"><BarList data={s.glTop} /></Card>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Company Code Wise" sub="Val in Cr" tint="copper"><PlantColumns data={s.company.slice(0, 15).map((d) => ({ ...d, value: d.value / CR }))} /></Card>
        <Card title="Month Wise Posting" sub="Last 24 months · Val in Cr" tint="sky"><PlantColumns data={s.months.map((d) => ({ name: `${d.name.slice(5)}-${d.name.slice(2, 4)}`, value: d.value / CR }))} /></Card>
      </div>
    </>}
    <div data-pdf-exclude><Card title="ZFBL1N Line Items" tint="neutral">
      <div className="mb-2 flex flex-wrap items-center gap-2"><input className="h-8 w-60 rounded-md border border-border bg-background px-2 text-xs" placeholder="Search vendor, document, G/L…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /><Button size="sm" variant="outline" onClick={exportXlsx}>Excel</Button><span className="text-[11px] text-muted-foreground">{num(tbl.data?.total ?? 0, 0)} lines</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[2000px] text-[11px]"><thead><tr className="border-b text-left">{HEADS.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
        <tbody>{(tbl.data?.rows ?? []).map((r, i) => <tr key={i} className="border-b border-border/50">{cells(r).map((v, j) => <td key={j} className={`whitespace-nowrap px-2 py-1 ${typeof v === "number" ? "text-right tabular-nums" : ""}`}>{typeof v === "number" ? num(v) : v}</td>)}</tr>)}</tbody>
        <tfoot><tr className="border-t-2 border-border font-bold"><td className="px-2 py-1.5" colSpan={HEADS.length - 1}>Total ({num(tbl.data?.total ?? 0, 0)} lines)</td><td className="px-2 py-1.5 text-right tabular-nums">{num(tbl.data?.sum ?? 0)}</td></tr></tfoot></table></div>
      <div className="mt-2 flex items-center gap-2 text-[11px]"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button><span>Page {page + 1} / {pages}</span><Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></div>
    </Card></div>
  </div>;
}
