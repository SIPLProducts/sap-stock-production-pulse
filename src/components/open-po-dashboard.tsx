import { useId, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ClipboardList, IndianRupee, Maximize2, PackageCheck, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { datedFileName } from "@/lib/format";
import { radiantBar } from "@/lib/radiant";
import { TINTS, type Tint } from "@/lib/card-tints";

const COLORS = ["#1f6fd1", "#0f9d8a", "#e08a1e", "#8e44ad", "#d64550", "#3a8dde", "#16a3b8", "#c0841a", "#5c6bc0", "#2e8b57"];
const AGING_COLORS = ["#0f9d8a", "#1f6fd1", "#e08a1e", "#d64550", "#6b7280"];
const CR = 1e7;
const cr = (v: number) => (v / CR).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const dmy = (d: string) => (d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}` : "");
const sel = "h-8 w-full rounded-md border border-border bg-background px-2 text-xs";


export function Card({ title, sub, children, className = "", tint = "neutral" }: { title: string; sub?: ReactNode; children: ReactNode; className?: string; tint?: Tint }) {
  const [open, setOpen] = useState(false);
  return <section className={`flex min-w-0 flex-col rounded-xl border p-2 ${className}`} style={TINTS[tint]}>
    <div className="mb-2 flex items-center justify-between gap-2"><h2 className="border-b-2 pb-0.5 text-xs font-bold text-foreground" style={{ borderColor: TINTS[tint].borderColor }}>{title}</h2><div className="flex items-center gap-1">{sub ? <span className="text-[10px] font-medium text-foreground/70">{sub}</span> : null}<button type="button" data-pdf-exclude data-html2canvas-ignore aria-label={`Full screen: ${title}`} title="Full screen" onClick={() => setOpen(true)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Maximize2 className="size-3.5" /></button></div></div>
    <div className="min-h-0 flex-1">{children}</div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col sm:max-w-[96vw]">
        <DialogHeader><DialogTitle>{title}{sub ? <span className="ml-2 text-xs font-normal text-muted-foreground">{sub}</span> : null}</DialogTitle></DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto text-sm [&_.h-56]:h-[75vh] [&_.recharts-responsive-container]:min-h-[60vh]">{children}</div>
      </DialogContent>
    </Dialog>
  </section>;
}
export function Tile({ icon, label, value, note, tone, unit }: { icon: ReactNode; label: string; value: string; note?: string; tone: string; unit?: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-on-radiant shadow-md" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${tone} 65%, white), ${tone})` }}>
    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background/20">{icon}</div>
    <div className="min-w-0"><p className="truncate text-xs font-semibold opacity-90">{label}</p><p className="truncate text-lg font-bold">{value}</p>{unit ? <p className="truncate text-[10px] font-medium opacity-85">{unit}</p> : null}{note ? <p className="truncate text-[10px] opacity-85">{note}</p> : null}</div>
  </div>;
}
export function BarList({ data, empty = "No data", fmt = cr }: { data: { name: string; value: number }[]; empty?: string; fmt?: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  if (!data.length) return <p className="py-8 text-center text-xs text-muted-foreground">{empty}</p>;
  return <ul className="space-y-1.5">{data.map((d, i) => <li key={d.name} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-[11px]">
    <span className="truncate font-semibold text-foreground" title={d.name}>{d.name}</span>
    <span className="h-3.5 rounded-full bg-background/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]"><span className="block h-full rounded-full" style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, background: `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), ${radiantBar(i)}`, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} /></span>
    <span className="tabular-nums font-bold text-foreground">{fmt(d.value)}</span>
  </li>)}</ul>;
}
export function Donut({ data, colors = COLORS, heads }: { data: { name: string; value: number }[]; colors?: string[]; heads?: [string, string, string] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return <div className="@container"><div className="grid grid-cols-1 items-center gap-2 @[17rem]:grid-cols-[minmax(0,6rem)_minmax(0,1fr)]">
    <div className="relative h-36"><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center leading-tight"><p className="text-[8px] font-semibold text-foreground/70">Total</p><p className="text-[10px] font-bold tabular-nums text-foreground">{cr(total)}</p></div></div><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={1}>{data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v: number) => cr(v)} /></PieChart></ResponsiveContainer></div>
    <ul className="min-w-0 space-y-1 text-[10px]">{heads ? <li className="flex items-center gap-1.5 border-b border-border pb-1 text-[10px] font-bold text-foreground/75"><span className="size-2.5" /><span className="min-w-0 flex-1">{heads[0]}</span><span className="shrink-0">{heads[1]}</span><span className="w-8 shrink-0 text-right">{heads[2]}</span></li> : null}{data.map((d, i) => <li key={d.name} className="flex items-center gap-1.5"><span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} /><span title={d.name} className="min-w-0 flex-1 break-words font-semibold leading-tight text-foreground">{d.name}</span><span className="shrink-0 font-bold text-foreground tabular-nums">{cr(d.value)}</span><span className="w-8 shrink-0 text-right font-semibold text-foreground/75 tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span></li>)}</ul>
  </div></div>;
}

export function PlantColumns({ data }: { data: { name: string; value: number }[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <div className="h-56"><ResponsiveContainer><BarChart data={data} margin={{ top: 16, left: -16, right: 4 }}>
    <defs>{COLORS.map((c, i) => <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={0.6} /><stop offset="35%" stopColor={c} stopOpacity={0.9} /><stop offset="100%" stopColor={c} stopOpacity={1} /></linearGradient>)}</defs>
    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} /><YAxis tick={{ fontSize: 10, fill: "var(--foreground)" }} />
    <Tooltip formatter={(v: number) => v.toFixed(2)} />
    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40} stroke="rgba(255,255,255,0.5)" strokeWidth={1}>{data.map((_, i) => <Cell key={i} fill={`url(#${id}-${i % COLORS.length})`} />)}
      <LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(2)} style={{ fontSize: 10, fontWeight: 700, fill: "var(--foreground)" }} /></Bar>
  </BarChart></ResponsiveContainer></div>;
}
