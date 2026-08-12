"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import {
  House, CaretRight, Plus, MagnifyingGlass, CalendarBlank, CaretDown, Sliders,
  DotsThreeVertical, Eye, Export as ExportIcon, ClipboardText, FolderOpen,
  Hourglass, CheckCircle, WarningCircle, Snowflake, Lightning, Wind,
  PlugsConnected, Drop, Wrench, ArrowLeft, ArrowRight,
  UserSwitch, PencilSimple, XCircle,
} from "@phosphor-icons/react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, LabelList,
  LineChart, Line, CartesianGrid,
} from "recharts";
import MetricCard from "@/components/shared/MetricCard";
import FiltersDrawer, { type FilterRow } from "@/components/leads/FiltersDrawer";
import { useTheme } from "@/components/ThemeContext";
import {
  ALL_JOBS, STATUS_ORDER, SERVICE_TYPE_ORDER, STATUS_META, SERVICE_TYPE_META,
  PRIORITY_META, TECHNICIANS, TECHNICIAN_AVATARS, REGIONS,
  type JobStatus, type JobPriority, type ServiceType,
} from "@/lib/jobsData";

// ---------------------------------------------
//  Config
// ---------------------------------------------
const SERVICE_ICON: Record<ServiceType, typeof Snowflake> = {
  "AC Repair": Snowflake,
  "Generator Service": Lightning,
  "HVAC Maintenance": Wind,
  "Electrical Repair": PlugsConnected,
  "Plumbing": Drop,
  "Other Services": Wrench,
};

const PAGE_SIZE = 10;
const DATE_PRESETS = ["May 20 – May 26, 2026", "Last 7 Days", "This Month", "Last 30 Days", "All Time"];

const JOB_FILTER_COLUMNS = [
  { value: "jobId",       label: "Job · ID"           },
  { value: "customer",    label: "Job · Customer"     },
  { value: "serviceType", label: "Job · Service Type" },
  { value: "technician",  label: "Job · Technician"   },
  { value: "priority",    label: "Job · Priority"     },
  { value: "status",      label: "Job · Status"       },
  { value: "region",      label: "Job · Region"       },
];

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...out].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const withGaps: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - (sorted[i - 1] as number) > 1) withGaps.push("…");
    withGaps.push(n);
  });
  return withGaps;
}

// ---------------------------------------------
//  Small reusable pieces
// ---------------------------------------------
function DropdownField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const active = value !== "All";
  return (
    <>
      <Button
        onClick={e => setAnchor(e.currentTarget)}
        endIcon={<CaretDown size={11} weight="bold" />}
        sx={{
          justifyContent: "space-between", textTransform: "none", fontWeight: 500, fontSize: "13.5px",
          borderRadius: "10px", px: 1.5, py: 0.9, minWidth: 148,
          border: `1px solid ${active ? "var(--serviceops-primary)" : isDark ? "#27272A" : "var(--serviceops-soft)"}`,
          color: active ? "var(--serviceops-primary)" : isDark ? "#D4D4D8" : "#334155",
          bgcolor: isDark ? "#0A0A0A" : "#fff",
          "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0F0F0F" : "var(--serviceops-tint)" },
        }}>
        <span className="flex flex-col items-start leading-tight">
          <span className={`text-[10px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{label}</span>
          <span className="truncate max-w-[110px]">{value}</span>
        </span>
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(245,158,11,0.12)", minWidth: 190, maxHeight: 340 } }}>
        {options.map(opt => (
          <MenuItem key={opt} selected={opt === value} onClick={() => { onChange(opt); setAnchor(null); }}
            sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px", "&.Mui-selected": { bgcolor: isDark ? "#27272A" : "var(--serviceops-tint)", color: "var(--serviceops-primary)", fontWeight: 600 } }}>
            {opt}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function StatusPill({ status, isDark }: { status: JobStatus; isDark: boolean }) {
  const m = STATUS_META[status];
  const color = isDark ? m.dark : m.light;
  const bg = isDark ? m.bgDark : m.bgLight;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-2 py-[3px] rounded-full leading-none whitespace-nowrap"
      style={{ backgroundColor: bg, color }}>
      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}

function PriorityPill({ priority, isDark }: { priority: JobPriority; isDark: boolean }) {
  const m = PRIORITY_META[priority];
  return (
    <span className="inline-flex items-center text-[12.5px] font-semibold px-2 py-[3px] rounded-full leading-none"
      style={{ backgroundColor: isDark ? m.bgDark : m.bg, color: isDark ? m.textDark : m.text }}>
      {priority}
    </span>
  );
}

// ---------------------------------------------
//  Page
// ---------------------------------------------
export default function JobsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch]         = useState("");
  const [dateRange, setDateRange]   = useState(DATE_PRESETS[0]);
  const [statusF, setStatusF]       = useState("All");
  const [priorityF, setPriorityF]   = useState("All");
  const [techF, setTechF]           = useState("All");
  const [customerF, setCustomerF]   = useState("All");
  const [serviceF, setServiceF]     = useState("All");
  const [regionF, setRegionF]       = useState("All");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [filtersAnchor, setFiltersAnchor] = useState<HTMLElement | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterRow[]>([]);
  const [rowMenu, setRowMenu]       = useState<{ anchor: HTMLElement; id: number } | null>(null);
  const [bulkAnchor, setBulkAnchor] = useState<HTMLElement | null>(null);
  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);

  const customers = useMemo(() => Array.from(new Set(ALL_JOBS.map(j => j.customer))).sort(), []);

  const applyFilter = (next: () => void) => { next(); setPage(1); };

  const filtered = useMemo(() => ALL_JOBS.filter(j => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || j.jobId.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q) || j.technician.toLowerCase().includes(q);
    const matchStatus = statusF === "All" || j.status === statusF;
    const matchPriority = priorityF === "All" || j.priority === priorityF;
    const matchTech = techF === "All" || j.technician === techF;
    const matchCustomer = customerF === "All" || j.customer === customerF;
    const matchService = serviceF === "All" || j.serviceType === serviceF;
    const matchRegion = regionF === "All" || j.region === regionF;
    const matchAdv = activeFilters.every(f => {
      const raw = (j as unknown as Record<string, string>)[f.column] ?? "";
      const val = raw.toLowerCase();
      const fv = f.value.toLowerCase();
      switch (f.operator) {
        case "contains":         return val.includes(fv);
        case "does_not_contain": return !val.includes(fv);
        case "equals":           return val === fv;
        case "does_not_equal":   return val !== fv;
        case "starts_with":      return val.startsWith(fv);
        case "ends_with":        return val.endsWith(fv);
        case "is_empty":         return val === "";
        case "is_not_empty":     return val !== "";
        default:                 return true;
      }
    });
    return matchSearch && matchStatus && matchPriority && matchTech && matchCustomer && matchService && matchRegion && matchAdv;
  }), [search, statusF, priorityF, techF, customerF, serviceF, regionF, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageIds = pageRows.map(r => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id));

  const toggleRow = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllOnPage = () => setSelected(prev => {
    const next = new Set(prev);
    if (allPageSelected) pageIds.forEach(id => next.delete(id));
    else pageIds.forEach(id => next.add(id));
    return next;
  });

  // KPIs — computed from the full dataset (not the filtered/paginated view)
  const kpis = useMemo(() => {
    const total = ALL_JOBS.length;
    const open = ALL_JOBS.filter(j => j.status === "Scheduled").length;
    const inProgress = ALL_JOBS.filter(j => j.status === "In Progress").length;
    const completed = ALL_JOBS.filter(j => j.status === "Completed").length;
    const slaBreached = ALL_JOBS.filter(j => j.slaBreached).length;
    return { total, open, inProgress, completed, slaBreached };
  }, []);

  // Chart data
  const statusChartData = useMemo(() => STATUS_ORDER.map(s => ({
    name: s, value: ALL_JOBS.filter(j => j.status === s).length,
  })), []);
  const serviceChartData = useMemo(() => SERVICE_TYPE_ORDER.map(s => ({
    name: s, value: ALL_JOBS.filter(j => j.serviceType === s).length,
  })), []);
  const trendData = [
    { day: "May 20", jobs: 34 }, { day: "May 21", jobs: 41 }, { day: "May 22", jobs: 38 },
    { day: "May 23", jobs: 52 }, { day: "May 24", jobs: 47 }, { day: "May 25", jobs: 29 },
    { day: "May 26", jobs: 22 },
  ];

  return (
    <div className="sidebar-content flex-1 flex flex-col min-h-screen overflow-auto">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 animate-fade-in">

        {/* -- Breadcrumb + Header -- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className={`flex items-center gap-1.5 text-[13.5px]/[18px] mb-1 ${isDark ? "text-[#E4E4E7]" : "text-slate-400"}`}>
              <House size={16} weight="duotone" />
              <CaretRight size={12} weight="duotone" />
              <Link href="/jobs" className={`transition-colors font-medium ${isDark ? "hover:text-[#D4D4D8]" : "hover:text-[var(--serviceops-primary)]"}`}>Jobs</Link>
            </div>
            <h1 className="font-heading text-lg sm:text-[22px]/[28px] font-semibold text-slate-900 tracking-tight m-0">Jobs</h1>
          </div>

          <Button variant="contained"
            startIcon={<Plus size={16} weight="bold" />}
            sx={{ bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)", color: isDark ? "#F4F4F5" : "#3B1F00", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "15px", px: 2.25, py: 0.85, boxShadow: isDark ? "none" : "0 1px 8px 0 rgba(245,158,11,0.35)", "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)", boxShadow: isDark ? "none" : "0 2px 14px 0 rgba(245,158,11,0.38)" }, "&:active": { bgcolor: isDark ? "#52525B" : "var(--serviceops-hover)" } }}>
            Create Job
          </Button>
        </div>

        {/* -- Toolbar row 1: search + date + status + priority -- */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 lg:w-80 focus-within:border-[var(--serviceops-primary)] focus-within:border-2 focus-within:shadow-[0_0_0_2px_var(--serviceops-primary)] transition-all ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-[#f9fbff] border-[var(--serviceops-soft)]"}`}>
            <MagnifyingGlass size={15} color="#94A3B8" weight="duotone" />
            <InputBase placeholder="Search jobs, customer, technician…" value={search}
              onChange={e => applyFilter(() => setSearch(e.target.value))}
              sx={{ flex: 1, fontSize: "0.86rem", color: isDark ? "#D4D4D8" : "#334155", "& input::placeholder": { color: "#94A3B8", opacity: 1 } }}
            />
            {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 text-sm">✕</button>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={e => setDateAnchor(e.currentTarget)}
              startIcon={<CalendarBlank size={14} weight="duotone" />}
              endIcon={<CaretDown size={11} weight="bold" />}
              sx={{ textTransform: "none", fontWeight: 500, fontSize: "13.5px", borderRadius: "10px", px: 1.5, py: 0.9,
                border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, color: isDark ? "#D4D4D8" : "#334155", bgcolor: isDark ? "#0A0A0A" : "#fff",
                "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0F0F0F" : "var(--serviceops-tint)" } }}>
              {dateRange}
            </Button>
            <Menu anchorEl={dateAnchor} open={Boolean(dateAnchor)} onClose={() => setDateAnchor(null)}
              PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, minWidth: 190 } }}>
              {DATE_PRESETS.map(opt => (
                <MenuItem key={opt} selected={opt === dateRange} onClick={() => { setDateRange(opt); setDateAnchor(null); }}
                  sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px", "&.Mui-selected": { bgcolor: isDark ? "#27272A" : "var(--serviceops-tint)", color: "var(--serviceops-primary)", fontWeight: 600 } }}>
                  {opt}
                </MenuItem>
              ))}
            </Menu>

            <DropdownField label="Status" value={statusF} options={["All", ...STATUS_ORDER]} onChange={v => applyFilter(() => setStatusF(v))} />
            <DropdownField label="Priority" value={priorityF} options={["All", "High", "Medium", "Low"]} onChange={v => applyFilter(() => setPriorityF(v))} />
          </div>
        </div>

        {/* -- Toolbar row 2: technician / customer / service type / region / filters -- */}
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownField label="Technician" value={techF} options={["All", ...TECHNICIANS]} onChange={v => applyFilter(() => setTechF(v))} />
          <DropdownField label="Customer" value={customerF} options={["All", ...customers]} onChange={v => applyFilter(() => setCustomerF(v))} />
          <DropdownField label="Service Type" value={serviceF} options={["All", ...SERVICE_TYPE_ORDER]} onChange={v => applyFilter(() => setServiceF(v))} />
          <DropdownField label="Region" value={regionF} options={["All", ...REGIONS]} onChange={v => applyFilter(() => setRegionF(v))} />

          <Button variant="outlined" size="small"
            startIcon={<Sliders size={14} weight="duotone" />}
            onClick={e => setFiltersAnchor(e.currentTarget)}
            sx={{
              ml: { sm: "auto" },
              borderColor: activeFilters.length > 0 ? "var(--serviceops-primary)" : isDark ? "#27272A" : "var(--serviceops-soft)",
              color: activeFilters.length > 0 ? "#3B1F00" : isDark ? "#E4E4E7" : "#3B1F00",
              bgcolor: activeFilters.length > 0 ? "var(--serviceops-primary)" : isDark ? "#0F0F0F" : "var(--serviceops-tint)",
              borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "14px",
              "&:hover": {
                borderColor: activeFilters.length > 0 ? "var(--serviceops-action)" : "var(--serviceops-primary)",
                bgcolor: activeFilters.length > 0 ? "var(--serviceops-action)" : isDark ? "#0A0A0A" : "var(--serviceops-soft)",
              },
            }}>
            Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
          </Button>
        </div>

        {/* -- KPI stat cards -- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <MetricCard title="Total Jobs" value={kpis.total.toLocaleString()} icon={<ClipboardText size={18} weight="duotone" />} fill="var(--serviceops-tint)" accent="var(--serviceops-primary)" isDark={isDark} />
          <MetricCard title="Open Jobs" value={kpis.open} icon={<FolderOpen size={18} weight="duotone" />} fill="var(--serviceops-surface)" accent="var(--serviceops-action)" isDark={isDark} />
          <MetricCard title="In Progress" value={kpis.inProgress} icon={<Hourglass size={18} weight="duotone" />} fill="var(--serviceops-soft)" accent="var(--serviceops-depth)" isDark={isDark} />
          <MetricCard title="Completed" value={kpis.completed.toLocaleString()} icon={<CheckCircle size={18} weight="duotone" />} fill="var(--serviceops-tint)" accent="var(--serviceops-primary)" isDark={isDark} />
          <MetricCard title="SLA Breached" value={kpis.slaBreached} icon={<WarningCircle size={18} weight="duotone" />} fill="var(--serviceops-surface)" accent="var(--serviceops-depth)" isDark={isDark} />
        </div>

        {/* -- Job List card -- */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
          <div className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b flex-wrap ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
            <p className={`font-heading text-[15px] font-semibold m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
              Job List <span className={isDark ? "text-[#71717A]" : "text-slate-400"}>({filtered.length})</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outlined" size="small" startIcon={<ExportIcon size={14} weight="duotone" />}
                sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)", color: isDark ? "#D4D4D8" : "#334155", bgcolor: isDark ? "#0F0F0F" : "#fff", borderRadius: "9px", textTransform: "none", fontWeight: 500, fontSize: "13.5px", "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0A0A0A" : "var(--serviceops-tint)" } }}>
                Export
              </Button>
              <Button variant="contained" size="small" disabled={selected.size === 0}
                onClick={e => setBulkAnchor(e.currentTarget)}
                sx={{ bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)", color: "#3B1F00", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "13.5px", boxShadow: "none", "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" }, "&.Mui-disabled": { bgcolor: isDark ? "#18181B" : "var(--serviceops-tint)", color: isDark ? "#52525B" : "#94A3B8" } }}>
                Bulk Actions{selected.size > 0 ? ` (${selected.size})` : ""}
              </Button>
            </div>
          </div>

          {/* -- Table -- */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[880px]">
              <thead>
                <tr className={isDark ? "bg-[#18181B]" : "bg-[var(--serviceops-soft)]"}>
                  <th className="w-10 pl-4 py-2.5">
                    <Checkbox size="small" checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected}
                      onChange={toggleAllOnPage}
                      sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#CBD5E1", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "var(--serviceops-primary)" } }} />
                  </th>
                  {["Job ID", "Customer", "Service Type", "Technician", "Priority", "Status", "ETA / SLA", ""].map(h => (
                    <th key={h} className={`text-left px-3 py-2.5 font-heading text-[12px] font-semibold uppercase tracking-wide whitespace-nowrap ${isDark ? "text-[#E4E4E7]" : "text-[#737373]"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(job => {
                  const ServiceIcon = SERVICE_ICON[job.serviceType];
                  const svcColor = isDark ? SERVICE_TYPE_META[job.serviceType].dark : SERVICE_TYPE_META[job.serviceType].light;
                  return (
                    <tr key={job.id} onClick={() => router.push(`/jobs/${job.id}`)}
                      className={`cursor-pointer border-t transition-colors group ${isDark ? "border-[#18181B] hover:bg-[#0F0F0F]" : "border-[var(--serviceops-tint)] hover:bg-[rgba(245,158,11,0.06)]"} ${selected.has(job.id) ? (isDark ? "bg-[#18181B]" : "bg-[rgba(245,158,11,0.08)]") : ""}`}>
                      <td className="pl-4 py-2.5" onClick={e => e.stopPropagation()}>
                        <Checkbox size="small" checked={selected.has(job.id)} onChange={() => toggleRow(job.id)}
                          sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#CBD5E1", "&.Mui-checked": { color: "var(--serviceops-primary)" } }} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Link href={`/jobs/${job.id}`} onClick={e => e.stopPropagation()}
                          className={`font-heading text-[14px] font-semibold hover:underline whitespace-nowrap ${isDark ? "text-[var(--serviceops-primary)]" : "text-[var(--serviceops-primary)]"}`}>
                          {job.jobId}
                        </Link>
                      </td>
                      <td className={`px-3 py-2.5 text-[13.5px] whitespace-nowrap ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{job.customer}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>
                          <ServiceIcon size={13} weight="duotone" color={svcColor} />
                          {job.serviceType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar src={TECHNICIAN_AVATARS[job.technician]} sx={{ width: 22, height: 22, fontSize: "0.55rem", flexShrink: 0 }} />
                          <span className={`text-[13.5px] truncate ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{job.technician}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><PriorityPill priority={job.priority} isDark={isDark} /></td>
                      <td className="px-3 py-2.5"><StatusPill status={job.status} isDark={isDark} /></td>
                      <td className="px-3 py-2.5">
                        <p className={`m-0 text-[13px] font-medium whitespace-nowrap ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{job.etaLabel}</p>
                        <p className={`m-0 text-[11.5px] whitespace-nowrap flex items-center gap-1 ${job.slaBreached ? "text-red-500 font-semibold" : isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                          {job.slaBreached && <WarningCircle size={11} weight="fill" />}
                          {job.slaLabel}
                        </p>
                      </td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => router.push(`/jobs/${job.id}`)}
                              sx={{ borderRadius: "6px", p: 0.6, "&:hover": { bgcolor: isDark ? "#27272A" : "var(--serviceops-tint)" } }}>
                              <Eye size={15} color="#94A3B8" weight="duotone" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Actions">
                            <IconButton size="small" onClick={e => setRowMenu({ anchor: e.currentTarget, id: job.id })}
                              sx={{ borderRadius: "6px", p: 0.6, "&:hover": { bgcolor: isDark ? "#27272A" : "var(--serviceops-tint)" } }}>
                              <DotsThreeVertical size={15} color="#94A3B8" weight="duotone" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isDark ? "bg-[#27272A]" : "bg-[#f9fbff]"}`}>
                        <Wrench size={22} color={isDark ? "#3F3F46" : "#94A3B8"} weight="duotone" />
                      </div>
                      <p className={`font-heading text-sm font-semibold ${isDark ? "text-[#9CA3AF]" : "text-slate-500"}`}>No jobs found</p>
                      <p className={`text-xs mt-1 ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>Try adjusting your search or filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* -- Pagination footer -- */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
            <p className={`m-0 text-[12.5px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
              {filtered.length === 0 ? "No entries" : `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} entries`}
            </p>
            <div className="flex items-center gap-1">
              <IconButton size="small" disabled={safePage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                sx={{ borderRadius: "8px", p: 0.7, border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}` }}>
                <ArrowLeft size={13} weight="bold" />
              </IconButton>
              {pageList(safePage, totalPages).map((p, i) => p === "…" ? (
                <span key={`gap-${i}`} className={`px-1.5 text-[12.5px] ${isDark ? "text-[#52525B]" : "text-slate-300"}`}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
                    p === safePage
                      ? "bg-[var(--serviceops-primary)] text-[#3B1F00]"
                      : isDark ? "text-[#D4D4D8] hover:bg-[#27272A]" : "text-slate-600 hover:bg-[var(--serviceops-tint)]"
                  }`}>
                  {p}
                </button>
              ))}
              <IconButton size="small" disabled={safePage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                sx={{ borderRadius: "8px", p: 0.7, border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}` }}>
                <ArrowRight size={13} weight="bold" />
              </IconButton>
            </div>
          </div>
        </div>

        {/* -- Charts row -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Jobs by Status */}
          <div className={`rounded-2xl border shadow-sm p-5 ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
            <p className={`font-heading text-[14px] font-bold mb-4 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>Jobs by Status</p>
            <div className="flex items-center gap-4">
              <div className="relative w-[132px] h-[132px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="100%" paddingAngle={2} stroke="none">
                      {statusChartData.map(d => (
                        <Cell key={d.name} fill={isDark ? STATUS_META[d.name as JobStatus].dark : STATUS_META[d.name as JobStatus].light} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v: number, n: string) => [`${v} jobs`, n]}
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, backgroundColor: isDark ? "#18181B" : "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-[18px] font-extrabold leading-none ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{kpis.total.toLocaleString()}</span>
                  <span className={`text-[10px] mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Total</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                {statusChartData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[12px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isDark ? STATUS_META[d.name as JobStatus].dark : STATUS_META[d.name as JobStatus].light }} />
                    <span className={`flex-1 truncate ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{d.name}</span>
                    <span className={`font-semibold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{d.value}</span>
                    <span className={isDark ? "text-[#52525B]" : "text-slate-300"}>({kpis.total ? Math.round((d.value / kpis.total) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Jobs by Service Type */}
          <div className={`rounded-2xl border shadow-sm p-5 ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
            <p className={`font-heading text-[14px] font-bold mb-2 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>Jobs by Service Type</p>
            <ResponsiveContainer width="100%" height={216}>
              <BarChart data={serviceChartData} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barSize={12}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#A1A1AA" : "#64748B", fontWeight: 500 }} axisLine={false} tickLine={false} width={110} />
                <RTooltip formatter={(v: number) => [`${v} jobs`, ""]} contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, backgroundColor: isDark ? "#18181B" : "#fff" }} cursor={{ fill: isDark ? "#18181B" : "var(--serviceops-tint)" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 10.5, fontWeight: 600, fill: isDark ? "#A1A1AA" : "#64748B" }} />
                  {serviceChartData.map(d => (
                    <Cell key={d.name} fill={isDark ? SERVICE_TYPE_META[d.name as ServiceType].dark : SERVICE_TYPE_META[d.name as ServiceType].light} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Jobs Trend */}
          <div className={`rounded-2xl border shadow-sm p-5 ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
            <p className={`font-heading text-[14px] font-bold mb-2 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>Jobs Trend (This Week)</p>
            <ResponsiveContainer width="100%" height={216}>
              <LineChart data={trendData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272A" : "var(--serviceops-soft)"} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: isDark ? "#A1A1AA" : "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10.5, fill: isDark ? "#A1A1AA" : "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
                <RTooltip formatter={(v: number) => [`${v} jobs`, ""]} contentStyle={{ borderRadius: 10, fontSize: 12, border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, backgroundColor: isDark ? "#18181B" : "#fff" }} cursor={{ stroke: "var(--serviceops-primary)", strokeWidth: 1, strokeDasharray: "4 3" }} />
                <Line type="monotone" dataKey="jobs" stroke="var(--serviceops-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--serviceops-primary)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>

      {/* -- Row actions menu -- */}
      <Menu anchorEl={rowMenu?.anchor ?? null} open={Boolean(rowMenu)} onClose={() => setRowMenu(null)}
        PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, minWidth: 190 } }}>
        <MenuItem onClick={() => { const id = rowMenu?.id; setRowMenu(null); if (id) router.push(`/jobs/${id}`); }}
          sx={{ mx: 0.5, borderRadius: "8px", py: 0.9 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><Eye size={15} weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setRowMenu(null)} sx={{ mx: 0.5, borderRadius: "8px", py: 0.9 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><UserSwitch size={15} weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Reassign Technician</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setRowMenu(null)} sx={{ mx: 0.5, borderRadius: "8px", py: 0.9 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><PencilSimple size={15} weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Change Status</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5, borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />
        <MenuItem onClick={() => setRowMenu(null)} sx={{ mx: 0.5, borderRadius: "8px", py: 0.9, color: "#EF4444" }}>
          <ListItemIcon sx={{ minWidth: 30 }}><XCircle size={15} color="#EF4444" weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px", color: "#EF4444" }}>Cancel Job</ListItemText>
        </MenuItem>
      </Menu>

      {/* -- Bulk actions menu -- */}
      <Menu anchorEl={bulkAnchor} open={Boolean(bulkAnchor) && selected.size > 0} onClose={() => setBulkAnchor(null)}
        PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, minWidth: 200 } }}>
        <MenuItem onClick={() => setBulkAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", py: 0.9 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><UserSwitch size={15} weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Assign Technician</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setBulkAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", py: 0.9 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><PencilSimple size={15} weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Update Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setBulkAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", py: 0.9 }}>
          <ListItemIcon sx={{ minWidth: 30 }}><ExportIcon size={15} weight="duotone" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Export Selected</ListItemText>
        </MenuItem>
      </Menu>

      <FiltersDrawer
        anchor={filtersAnchor} onClose={() => setFiltersAnchor(null)}
        filters={activeFilters} onChange={v => { setActiveFilters(v); setPage(1); }}
        columns={JOB_FILTER_COLUMNS}
        subtitle="Narrow down jobs by conditions"
      />
    </div>
  );
}
