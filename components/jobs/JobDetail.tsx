"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Checkbox from "@mui/material/Checkbox";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  House, CaretRight, CaretLeft, CaretDown, PencilSimple, DotsThreeVertical,
  Printer, Phone, EnvelopeSimple, MapPin, MapTrifold, Star, SealCheck,
  ChatCircleDots, PhoneCall, NavigationArrow, Truck, Plus, Image as ImageIcon,
  Camera, UserSwitch, ClipboardText, FileText, CalendarPlus, XCircle,
  CheckCircle, Circle, Sparkle, CaretRight as CaretRightSm,
} from "@phosphor-icons/react";
import {
  getJobById, STATUS_META, PRIORITY_META, TECHNICIAN_AVATARS, TECHNICIAN_PHONES,
  TECHNICIAN_RATINGS, CUSTOMER_DIRECTORY, ALL_JOBS,
  type JobRecord, type ServiceType,
} from "@/lib/jobsData";

// ─────────────────────────────────────────────
//  Per-service-type template data (drives the
//  Service Information / Parts / AI panels for
//  every job that isn't the hand-authored WO-1024)
// ─────────────────────────────────────────────
interface ServiceTemplate {
  problem: string; category: string; asset: string; durationHrs: number;
  laborCharge: number; parts: { item: string; qty: number; rate: number }[];
  recommendations: string[];
}
const SERVICE_TEMPLATES: Record<ServiceType, ServiceTemplate> = {
  "AC Repair": {
    problem: "AC Not Cooling", category: "Cooling Issue", asset: "AC Unit", durationHrs: 2, laborCharge: 1200,
    parts: [{ item: "Compressor", qty: 1, rate: 4500 }, { item: "Capacitor", qty: 1, rate: 650 }, { item: "Gas Refill (R22)", qty: 2, rate: 1200 }],
    recommendations: ["Similar issue reported 3 months ago.", "AC unit performance dropped by 15%.", "Recommend preventive maintenance in 12 days.", "Warranty expires in 12 days."],
  },
  "Generator Service": {
    problem: "Generator Not Starting", category: "Power Issue", asset: "Diesel Generator", durationHrs: 3, laborCharge: 1800,
    parts: [{ item: "Engine Oil (4L)", qty: 1, rate: 1400 }, { item: "Air Filter", qty: 1, rate: 900 }, { item: "Battery Terminal", qty: 2, rate: 350 }],
    recommendations: ["Fuel filter nearing service interval.", "Battery health at 72% — replace soon.", "Recommend load test within 30 days.", "AMC renewal due next quarter."],
  },
  "HVAC Maintenance": {
    problem: "Reduced Airflow", category: "Ventilation Issue", asset: "HVAC Unit", durationHrs: 4, laborCharge: 2200,
    parts: [{ item: "Air Filter (Set)", qty: 2, rate: 600 }, { item: "Duct Sealant", qty: 1, rate: 450 }, { item: "Fan Belt", qty: 1, rate: 750 }],
    recommendations: ["Duct pressure below optimal range.", "Filter change overdue by 2 weeks.", "Recommend full duct cleaning in 20 days.", "Energy usage up 9% vs last quarter."],
  },
  "Electrical Repair": {
    problem: "Power Fluctuation", category: "Electrical Fault", asset: "Distribution Panel", durationHrs: 2, laborCharge: 1000,
    parts: [{ item: "MCB Switch", qty: 2, rate: 850 }, { item: "Wiring Cable (10m)", qty: 1, rate: 1100 }, { item: "Circuit Breaker", qty: 1, rate: 1600 }],
    recommendations: ["Repeat fault logged in last 60 days.", "Panel load nearing rated capacity.", "Recommend thermal scan in 15 days.", "Insulation resistance trending down."],
  },
  "Plumbing": {
    problem: "Pipe Leakage", category: "Plumbing Issue", asset: "Water Supply Line", durationHrs: 2, laborCharge: 800,
    parts: [{ item: "PVC Pipe (5ft)", qty: 2, rate: 300 }, { item: "Pipe Joint", qty: 4, rate: 120 }, { item: "Sealant Tape", qty: 2, rate: 80 }],
    recommendations: ["Similar leak reported on same line.", "Water pressure above recommended range.", "Recommend line inspection in 30 days.", "Fixture warranty expires soon."],
  },
  "Other Services": {
    problem: "General Maintenance Request", category: "Facility Issue", asset: "Facility Equipment", durationHrs: 2, laborCharge: 900,
    parts: [{ item: "Service Kit", qty: 1, rate: 1500 }],
    recommendations: ["No prior history for this asset.", "Recommend condition audit next cycle.", "Preventive maintenance not yet scheduled."],
  },
};

const REGION_CITY: Record<string, string> = { North: "Delhi", South: "Bengaluru", East: "Kolkata", West: "Mumbai", Central: "Nagpur" };

const TECH_STATUS_LABEL: Record<string, string> = {
  Scheduled: "Scheduled", Assigned: "Assigned", "On Route": "On the Way",
  "In Progress": "Working On-site", "On Hold": "On Hold", Completed: "Job Completed", Cancelled: "Cancelled",
};

const STEP_ORDER = ["Job Created", "Technician Assigned", "Technician Accepted", "On the Way", "Reached Site", "Work Started", "Work Completed", "Invoice Generated"];
const STEP_DONE_COUNT: Record<string, number> = {
  Scheduled: 1, Assigned: 2, "On Route": 3, "In Progress": 6, "On Hold": 5, Completed: 8, Cancelled: 1,
};
const CHECKLIST_ITEMS = ["Inspection", "Diagnose Issue", "Replace / Repair", "Testing", "Customer Sign", "Close Job"];

function starRating(rating: number, size = 13) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} weight={rating >= i + 1 ? "fill" : rating > i ? "duotone" : "regular"}
          color={rating > i ? "#F59E0B" : "#E2E8F0"} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Derive a full detail view-model from the base
//  JobRecord (shared with the listing page).
// ─────────────────────────────────────────────
function buildDetail(job: JobRecord) {
  const tmpl = SERVICE_TEMPLATES[job.serviceType];
  const isPrimary = job.id === 1;

  const customerInfo = CUSTOMER_DIRECTORY[job.customer] ?? {
    phone: `+91 9${(80000000 + job.id * 137) % 10000000}`.padEnd(13, "0"),
    email: `facility@${job.customer.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    address: `${job.customer}, ${REGION_CITY[job.region] ?? "India"} Business District, ${REGION_CITY[job.region] ?? "India"}`,
  };

  const asset = isPrimary ? "AC Unit - LG 2 Ton (AC-1045)" : `${tmpl.asset} (${job.serviceType.slice(0, 2).toUpperCase()}-${1000 + job.id})`;
  const warranty = isPrimary ? "Valid Till 12 Dec 2026" : `Valid Till ${(job.id % 28) + 1} ${["Jan", "Mar", "Jun", "Sep", "Nov"][job.id % 5]} 202${6 + (job.id % 3)}`;
  const amcStatus = isPrimary ? "Active (Gold Plan)" : job.id % 3 === 0 ? "Not Enrolled" : `Active (${job.id % 2 === 0 ? "Silver" : "Gold"} Plan)`;

  const doneCount = STEP_DONE_COUNT[job.status] ?? 1;
  const cancelled = job.status === "Cancelled";
  const currentIndex = doneCount < 8 ? doneCount : null;

  const checklistChecked = cancelled ? 0 : Math.max(0, Math.min(CHECKLIST_ITEMS.length, doneCount - 1));

  const partsTotal = tmpl.parts.reduce((s, p) => s + p.qty * p.rate, 0);
  const labor = isPrimary ? 1200 : tmpl.laborCharge;
  const discount = isPrimary ? 325 : job.id % 4 === 0 ? 150 : 0;
  const tax = Math.round((labor + partsTotal) * 0.18);
  const total = labor + partsTotal + tax - discount;
  const paymentStatus = job.status === "Completed" ? (job.id % 3 === 0 ? "Pending" : "Paid") : job.status === "Cancelled" ? "N/A" : "Pending";

  const photoCount = isPrimary ? 3 : ["In Progress", "On Route", "Completed"].includes(job.status) ? (job.id % 4) + 1 : 0;

  const feedbackRating = isPrimary ? 4.5 : Math.round((3.6 + ((job.id * 7) % 14) / 10) * 10) / 10;

  const recs: { text: string; tone: "critical" | "warning" | "good" }[] = isPrimary
    ? [
        { text: "Similar issue reported 3 months ago.", tone: "critical" },
        { text: "AC unit performance dropped by 15%.", tone: "warning" },
        { text: "Recommend preventive maintenance in 12 days.", tone: "good" },
        { text: "Warranty expires in 12 days.", tone: "critical" },
      ]
    : tmpl.recommendations.map((text, i) => ({ text, tone: (["critical", "warning", "good"] as const)[i % 3] }));

  // Activity log — generated from the same step progression as the timeline
  const stepVerb = (i: number) => ([
    `Job ${job.jobId} created`, `Technician ${job.technician} assigned`, `Technician ${job.technician} accepted the job`,
    `Technician ${job.technician} is on the way`, "Technician reached the site", "Work started on-site",
    "Work completed on-site", "Invoice generated",
  ])[i];
  const shownSteps = cancelled ? [0] : Array.from({ length: Math.min(doneCount, 8) }, (_, i) => i);
  const activity = shownSteps.map(i => ({
    label: i === 0 ? `${stepVerb(0)} by Admin` : stepVerb(i),
    at: `${job.createdAt.split(",")[0]}, ${(9 + i)}:${i === 0 ? "30" : (30 + i * 5) % 60} ${9 + i >= 12 ? "PM" : "AM"}`,
  }));
  if (cancelled) activity.push({ label: `Job ${job.jobId} was cancelled`, at: job.createdAt.split(",")[0] });

  const related: { jobId: string; label: string; status: string; href?: string }[] = isPrimary
    ? [
        { jobId: "WO-0987", label: "AC Not Cooling", status: "Completed" },
        { jobId: "WO-0765", label: "Gas Leakage", status: "Completed" },
        { jobId: "WO-0543", label: "AC Servicing", status: "Completed" },
      ]
    : ALL_JOBS.filter(j => j.id !== job.id && j.customer === job.customer).slice(0, 3).map(j => ({
        jobId: j.jobId, label: j.serviceType, status: j.status, href: `/jobs/${j.id}`,
      }));

  return {
    customerInfo, asset, warranty, amcStatus, problem: tmpl.problem, category: tmpl.category, durationHrs: tmpl.durationHrs,
    doneCount, currentIndex, cancelled, checklistChecked, parts: tmpl.parts, partsTotal, labor, discount, tax, total,
    paymentStatus, photoCount, feedbackRating, recs, activity, related,
  };
}

function slaInfo(job: JobRecord, isPrimary: boolean) {
  if (isPrimary) return { label: "2h 15m remaining", pct: 32, tone: "ok" as const };
  if (job.status === "Completed") return { label: "SLA met", pct: 100, tone: "good" as const };
  if (job.status === "Cancelled") return { label: "SLA: —", pct: 0, tone: "neutral" as const };
  if (job.slaBreached) return { label: `Breached ${1 + (job.id % 3)}h ago`, pct: 100, tone: "critical" as const };
  const totalMin = job.slaHours * 60;
  const remaining = Math.max(15, (job.id * 41) % totalMin);
  return { label: `${Math.floor(remaining / 60)}h ${remaining % 60}m remaining`, pct: Math.round(100 - (remaining / totalMin) * 100), tone: "ok" as const };
}

// ─────────────────────────────────────────────
//  Small presentational helpers
// ─────────────────────────────────────────────
function Card({ title, icon: Icon, action, children }: { title: string; icon: React.ElementType; action?: React.ReactNode; children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden h-full ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[#E3ECFC]"}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? "border-[#27272A]" : "border-[#EFF6FF]"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
          <Icon size={13} color={isDark ? "#9CA3AF" : "#1D4ED8"} weight="duotone" />
        </div>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.1em] flex-1 truncate ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>{title}</p>
        {action}
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`flex items-start justify-between gap-3 py-2 border-b last:border-0 ${isDark ? "border-[#18181B]" : "border-[#F5F8FF]"}`}>
      <span className={`text-[12px] font-medium flex-shrink-0 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{label}</span>
      <span className={`text-[13px] font-semibold text-right ${isDark ? "text-[#E4E4E7]" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function MapPreview() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`relative rounded-xl overflow-hidden h-[230px] border ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}
      style={{
        backgroundColor: isDark ? "#0F172A" : "#EAF2FB",
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.18)"} 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.18)"} 28px), repeating-linear-gradient(90deg, transparent, transparent 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.18)"} 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(148,163,184,0.18)"} 28px)`,
      }}>
      <svg viewBox="0 0 400 230" className="absolute inset-0 w-full h-full">
        <path d="M40,190 C90,160 100,110 150,95 C200,80 220,50 260,35" fill="none" stroke="#1D4ED8" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" opacity="0.85" />
        <circle cx="40" cy="190" r="6" fill={isDark ? "#0A0A0A" : "#fff"} stroke="#1D4ED8" strokeWidth="2.5" />
        <circle cx="260" cy="35" r="5" fill="#EF4444" />
      </svg>
      <div className="absolute" style={{ left: "30%", top: "38%" }}>
        <div className="w-7 h-7 rounded-full bg-[#1D4ED8] flex items-center justify-center shadow-lg ring-4 ring-[#1D4ED8]/20">
          <Truck size={14} color="#fff" weight="fill" />
        </div>
      </div>
      <div className="absolute" style={{ left: "62%", top: "10%" }}>
        <MapPin size={22} color="#EF4444" weight="fill" />
      </div>
      <div className={`absolute bottom-2.5 left-2.5 px-2 py-1 rounded-lg text-[10.5px] font-medium shadow-sm ${isDark ? "bg-[#18181B] text-[#D4D4D8]" : "bg-white text-slate-600"}`}>
        Andheri West → Infiniti Mall
      </div>
      <div className="absolute bottom-2.5 right-2.5 flex flex-col gap-1">
        {["+", "–", "◎"].map(s => (
          <div key={s} className={`w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-bold shadow-sm ${isDark ? "bg-[#18181B] text-[#D4D4D8]" : "bg-white text-slate-500"}`}>{s}</div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────
export default function JobDetail({ jobId }: { jobId: number }) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const job = getJobById(jobId);

  const detail = useMemo(() => job ? buildDetail(job) : null, [job]);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [printAnchor, setPrintAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor]   = useState<HTMLElement | null>(null);

  const activeChecklist = checklist.length === CHECKLIST_ITEMS.length
    ? checklist
    : CHECKLIST_ITEMS.map((_, i) => i < (detail?.checklistChecked ?? 0));

  if (!job || !detail) {
    return (
      <div className="sidebar-content flex-1 flex flex-col min-h-screen overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xl font-bold mb-2 ${isDark ? "text-[#D4D4D8]" : "text-[#0C2472]"}`}>Job not found</div>
            <button onClick={() => router.push("/jobs")} className={`text-sm underline ${isDark ? "text-[#A1A1AA]" : "text-[#1D4ED8]"}`}>Back to Jobs</button>
          </div>
        </div>
      </div>
    );
  }

  const toggleChecklist = (i: number) => setChecklist(prev => {
    const base = prev.length === CHECKLIST_ITEMS.length ? prev : activeChecklist;
    const next = [...base];
    next[i] = !next[i];
    return next;
  });

  const statusColor = isDark ? STATUS_META[job.status].dark : STATUS_META[job.status].light;
  const statusBg = isDark ? STATUS_META[job.status].bgDark : STATUS_META[job.status].bgLight;
  const priorityMeta = PRIORITY_META[job.priority];
  const sla = slaInfo(job, job.id === 1);
  const techRating = TECHNICIAN_RATINGS[job.technician];

  return (
    <div className="sidebar-content flex-1 flex flex-col min-h-screen overflow-auto">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 animate-fade-in">

        {/* ── Breadcrumb + title + actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className={`flex items-center gap-1.5 text-[13px] mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
              <House size={14} weight="duotone" />
              <CaretRight size={11} weight="duotone" />
              <Link href="/jobs" className={`transition-colors font-medium ${isDark ? "hover:text-[#D4D4D8]" : "hover:text-[#1D4ED8]"}`}>Jobs</Link>
              <CaretRight size={11} weight="duotone" />
              <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-[#1D4ED8]"}`}>{job.jobId}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/jobs")} className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? "hover:bg-[#27272A] text-[#A1A1AA]" : "hover:bg-[#EFF6FF] text-slate-500"}`}>
                <CaretLeft size={16} weight="bold" />
              </button>
              <h1 className={`text-[19px] sm:text-[21px] font-extrabold tracking-tight m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>Job Details</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="small" variant="outlined" startIcon={<PencilSimple size={13} weight="duotone" />}
              sx={{ borderColor: isDark ? "#27272A" : "#E3ECFC", color: isDark ? "#D4D4D8" : "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
              Edit Job
            </Button>
            <Button size="small" variant="outlined" endIcon={<CaretDown size={11} weight="bold" />} startIcon={<Printer size={13} weight="duotone" />}
              onClick={e => setPrintAnchor(e.currentTarget)}
              sx={{ borderColor: isDark ? "#27272A" : "#E3ECFC", color: isDark ? "#D4D4D8" : "#334155", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
              Print
            </Button>
            <Menu anchorEl={printAnchor} open={Boolean(printAnchor)} onClose={() => setPrintAnchor(null)}
              PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`, minWidth: 170 } }}>
              <MenuItem onClick={() => setPrintAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>Print Job Card</MenuItem>
              <MenuItem onClick={() => setPrintAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>Print Invoice</MenuItem>
            </Menu>
            <Tooltip title="More actions">
              <IconButton size="small" onClick={e => setMoreAnchor(e.currentTarget)}
                sx={{ border: `1.5px solid ${isDark ? "#27272A" : "#E3ECFC"}`, borderRadius: "9px", bgcolor: isDark ? "#0F0F0F" : "transparent", p: 0.85, "&:hover": { borderColor: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
                <DotsThreeVertical size={16} weight="bold" color={isDark ? "#B4B5B6" : "#64748B"} />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}
              PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`, minWidth: 190 } }}>
              <MenuItem onClick={() => setMoreAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>Duplicate Job</MenuItem>
              <MenuItem onClick={() => setMoreAnchor(null)} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px", color: "#EF4444" }}>Cancel Job</MenuItem>
            </Menu>
          </div>
        </div>

        {/* ── Sub-info bar ── */}
        <div className={`rounded-2xl border shadow-sm px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[#E3ECFC]"}`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Work Order</p>
            <p className={`text-[15px] font-bold m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{job.jobId}</p>
          </div>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Priority</p>
            <span className="inline-flex items-center text-[12.5px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: isDark ? priorityMeta.bgDark : priorityMeta.bg, color: isDark ? priorityMeta.textDark : priorityMeta.text }}>{job.priority}</span>
          </div>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Status</p>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />{job.status}
            </span>
          </div>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>SLA</p>
            <p className={`text-[13px] font-semibold m-0 mb-1 ${sla.tone === "critical" ? "text-red-500" : sla.tone === "good" ? "text-emerald-500" : isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{sla.label}</p>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#27272A]" : "bg-[#EFF6FF]"}`}>
              <div className="h-full rounded-full" style={{ width: `${sla.pct}%`, backgroundColor: sla.tone === "critical" ? "#EF4444" : sla.tone === "good" ? "#10B981" : "#F59E0B" }} />
            </div>
          </div>
          <div className="col-span-2 sm:col-span-4 pt-1">
            <span className={`text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Created On </span>
            <span className={`text-[12.5px] font-medium ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{job.createdAt}</span>
          </div>
        </div>

        {/* ── Row 1: Customer / Service / Technician ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Customer Information" icon={ClipboardText}>
            <p className={`font-heading text-[15px] font-bold mb-2.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{job.customer}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px]">
                <Phone size={13} color="#94A3B8" weight="duotone" />
                <span className={isDark ? "text-[#D4D4D8]" : "text-slate-600"}>{detail.customerInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <EnvelopeSimple size={13} color="#94A3B8" weight="duotone" />
                <span className={`truncate ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{detail.customerInfo.email}</span>
              </div>
              <div className="flex items-start gap-2 text-[13px]">
                <MapPin size={13} color="#94A3B8" weight="duotone" className="mt-0.5 flex-shrink-0" />
                <span className={isDark ? "text-[#D4D4D8]" : "text-slate-600"}>{detail.customerInfo.address}</span>
              </div>
            </div>
            <button className={`flex items-center gap-1.5 mt-3 text-[12.5px] font-semibold transition-colors ${isDark ? "text-[#60A5FA] hover:text-[#93C5FD]" : "text-[#1D4ED8] hover:text-[#0C2472]"}`}>
              <MapTrifold size={14} weight="duotone" /> View on Map
            </button>
          </Card>

          <Card title="Service Information" icon={Sparkle}>
            <InfoRow label="Service Type" value={job.serviceType} />
            <InfoRow label="Problem Reported" value={detail.problem} />
            <InfoRow label="Category" value={detail.category} />
            <InfoRow label="Asset" value={detail.asset} />
            <InfoRow label="Warranty" value={detail.warranty} />
            <InfoRow label="AMC Status" value={detail.amcStatus} />
            <InfoRow label="Expected Duration" value={`${detail.durationHrs} Hours`} />
          </Card>

          <Card title="Assigned Technician" icon={UserSwitch}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={TECHNICIAN_AVATARS[job.technician]} sx={{ width: 44, height: 44 }} />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className={`text-[14.5px] font-bold m-0 truncate ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{job.technician}</p>
                  <SealCheck size={14} color="#1D4ED8" weight="fill" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {starRating(techRating.rating, 11)}
                  <span className={`text-[11.5px] ml-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{techRating.rating} · ({techRating.jobs} Jobs)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] mb-3">
              <Phone size={13} color="#94A3B8" weight="duotone" />
              <span className={isDark ? "text-[#D4D4D8]" : "text-slate-600"}>{TECHNICIAN_PHONES[job.technician]}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />{TECH_STATUS_LABEL[job.status]}
              </span>
              <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>ETA {job.etaLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[{ label: "Live Location", icon: NavigationArrow }, { label: "Call", icon: PhoneCall }, { label: "Chat", icon: ChatCircleDots }].map(({ label, icon: Icon }) => (
                <button key={label} className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#18181B] text-[#D4D4D8] hover:bg-[#27272A]" : "bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DCE6FB]"}`}>
                  <Icon size={15} weight="duotone" />{label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row 2: Live tracking + timeline / checklist ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <Card title="Live Tracking" icon={NavigationArrow}><MapPreview /></Card>
          </div>

          <div className="lg:col-span-1">
            <Card title="Job Timeline" icon={ClipboardText}>
              <div className="relative">
                <div className={`absolute left-[10px] top-1 bottom-1 w-px ${isDark ? "bg-[#27272A]" : "bg-[#E3ECFC]"}`} />
                <div className="space-y-3.5">
                  {STEP_ORDER.map((step, i) => {
                    const done = !detail.cancelled && i < detail.doneCount;
                    const current = !detail.cancelled && i === detail.currentIndex;
                    const skipped = detail.cancelled && i > 0;
                    return (
                      <div key={step} className="flex items-start gap-3 relative">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          done ? "bg-emerald-500" : current ? "bg-[#1D4ED8]" : isDark ? "bg-[#18181B] border border-[#27272A]" : "bg-white border border-[#E3ECFC]"
                        }`}>
                          {done ? <CheckCircle size={12} color="#fff" weight="fill" /> : current ? <span className="w-2 h-2 rounded-full bg-white" /> : <Circle size={8} color={isDark ? "#3F3F46" : "#CBD5E1"} weight="fill" />}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={`text-[13px] font-semibold m-0 ${skipped ? (isDark ? "text-[#3F3F46]" : "text-slate-300") : done || current ? (isDark ? "text-[#E4E4E7]" : "text-slate-700") : (isDark ? "text-[#52525B]" : "text-slate-300")}`}>{step}</p>
                          {i === 0 && <p className={`text-[11px] m-0 mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{job.createdAt}</p>}
                        </div>
                      </div>
                    );
                  })}
                  {detail.cancelled && (
                    <div className="flex items-start gap-3 relative">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-red-500">
                        <XCircle size={12} color="#fff" weight="fill" />
                      </div>
                      <p className="text-[13px] font-semibold text-red-500 m-0 pt-0.5">Job Cancelled</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card title="Checklist" icon={CheckCircle}>
              <div className="space-y-0.5 -mx-1">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <label key={item} className={`flex items-center gap-1.5 px-1 py-1 rounded-lg cursor-pointer transition-colors ${isDark ? "hover:bg-[#18181B]" : "hover:bg-[#F5F8FF]"}`}>
                    <Checkbox size="small" checked={activeChecklist[i]} onChange={() => toggleChecklist(i)}
                      sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#CBD5E1", "&.Mui-checked": { color: "#10B981" } }} />
                    <span className={`text-[13px] ${activeChecklist[i] ? (isDark ? "text-[#71717A] line-through" : "text-slate-400 line-through") : (isDark ? "text-[#D4D4D8]" : "text-slate-700")}`}>{item}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── Row 3: Parts / Photos / Invoice ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Parts & Materials" icon={ClipboardText}>
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className={isDark ? "text-[#71717A]" : "text-slate-400"}>
                  <th className="text-left font-semibold pb-1.5">Item</th>
                  <th className="text-right font-semibold pb-1.5">Qty</th>
                  <th className="text-right font-semibold pb-1.5">Rate (₹)</th>
                  <th className="text-right font-semibold pb-1.5">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {detail.parts.map(p => (
                  <tr key={p.item} className={`border-t ${isDark ? "border-[#18181B]" : "border-[#F5F8FF]"}`}>
                    <td className={`py-1.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{p.item}</td>
                    <td className={`py-1.5 text-right ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{p.qty}</td>
                    <td className={`py-1.5 text-right ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{p.rate.toLocaleString("en-IN")}</td>
                    <td className={`py-1.5 text-right font-semibold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{(p.qty * p.rate).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className={`flex items-center gap-1.5 mt-3 text-[12.5px] font-semibold transition-colors ${isDark ? "text-[#60A5FA] hover:text-[#93C5FD]" : "text-[#1D4ED8] hover:text-[#0C2472]"}`}>
              <Plus size={13} weight="bold" /> Add Item
            </button>
          </Card>

          <Card title="Job Photos" icon={Camera}>
            {detail.photoCount > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: detail.photoCount }).map((_, i) => (
                  <div key={i} className={`aspect-square rounded-lg flex items-center justify-center ${isDark ? "bg-[#18181B]" : "bg-[#EFF6FF]"}`}>
                    <ImageIcon size={20} color={isDark ? "#3F3F46" : "#94A3B8"} weight="duotone" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`flex items-center justify-center py-6 text-[13px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No photos yet</div>
            )}
            <button className={`flex items-center gap-1.5 mt-3 text-[12.5px] font-semibold transition-colors ${isDark ? "text-[#60A5FA] hover:text-[#93C5FD]" : "text-[#1D4ED8] hover:text-[#0C2472]"}`}>
              <Plus size={13} weight="bold" /> Add Photos
            </button>
          </Card>

          <Card title="Invoice Summary" icon={FileText}>
            <div className="space-y-1.5">
              {[["Labour Charges", detail.labor], ["Parts & Materials", detail.partsTotal], ["Tax (18%)", detail.tax], ["Discount", -detail.discount]].map(([label, val]) => (
                <div key={label as string} className="flex items-center justify-between text-[13px]">
                  <span className={isDark ? "text-[#A1A1AA]" : "text-slate-500"}>{label}</span>
                  <span className={isDark ? "text-[#D4D4D8]" : "text-slate-700"}>{(val as number) < 0 ? "-" : ""}₹{Math.abs(val as number).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className={`flex items-center justify-between pt-2 mt-1 border-t ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                <span className={`text-[14px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>Total Amount</span>
                <span className={`text-[16px] font-extrabold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>₹{detail.total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className={`text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Payment Status</span>
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: detail.paymentStatus === "Paid" ? (isDark ? "rgba(16,185,129,0.16)" : "#DCFCE7") : detail.paymentStatus === "N/A" ? (isDark ? "#27272A" : "#F1F5F9") : (isDark ? "rgba(245,158,11,0.16)" : "#FEF3C7"),
                    color: detail.paymentStatus === "Paid" ? "#10B981" : detail.paymentStatus === "N/A" ? "#94A3B8" : "#D97706",
                  }}>{detail.paymentStatus}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Row 4: Feedback / AI / Quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Customer Feedback" icon={Star}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Overall Rating</p>
            <div className="flex items-center gap-2 mb-3">
              {starRating(detail.feedbackRating, 17)}
              <span className={`text-[14px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{detail.feedbackRating}/5</span>
            </div>
            <Button size="small" variant="outlined" fullWidth
              sx={{ borderColor: isDark ? "#27272A" : "#E3ECFC", color: isDark ? "#D4D4D8" : "#1D4ED8", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.8rem", "&:hover": { borderColor: "#1D4ED8", bgcolor: isDark ? "#0A0A0A" : "#EFF6FF" } }}>
              View Feedback
            </Button>
          </Card>

          <Card title="AI Recommendations" icon={Sparkle}>
            <div className="space-y-2.5">
              {detail.recs.map((r, i) => {
                const color = r.tone === "critical" ? "#EF4444" : r.tone === "warning" ? "#F59E0B" : "#10B981";
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className={`text-[13px] leading-snug ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{r.text}</span>
                  </div>
                );
              })}
            </div>
            <button className={`flex items-center gap-1 mt-3 text-[12.5px] font-semibold transition-colors ${isDark ? "text-[#60A5FA] hover:text-[#93C5FD]" : "text-[#1D4ED8] hover:text-[#0C2472]"}`}>
              View All Insights <CaretRightSm size={11} weight="bold" />
            </button>
          </Card>

          <Card title="Quick Actions" icon={ClipboardText}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Assign Technician", icon: UserSwitch, color: "#1D4ED8" },
                { label: "Change Status", icon: PencilSimple, color: "#8B5CF6" },
                { label: "Generate Invoice", icon: FileText, color: "#10B981" },
                { label: "Schedule Follow-up", icon: CalendarPlus, color: "#F59E0B" },
                { label: "Close Job", icon: XCircle, color: "#EF4444" },
              ].map(({ label, icon: Icon, color }) => (
                <button key={label} className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-center transition-colors ${isDark ? "hover:bg-[#18181B]" : "hover:bg-[#F5F8FF]"}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "1A" }}>
                    <Icon size={15} color={color} weight="duotone" />
                  </div>
                  <span className={`text-[10.5px] font-medium leading-tight ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Row 5: Activity log / Related jobs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
          <Card title="Activity Log" icon={ClipboardText} action={<button className={`text-[11.5px] font-semibold ${isDark ? "text-[#60A5FA]" : "text-[#1D4ED8]"}`}>View All</button>}>
            <div className="space-y-3">
              {detail.activity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isDark ? "bg-[#3F3F46]" : "bg-slate-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] m-0 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{a.label}</p>
                    <p className={`text-[11px] m-0 mt-0.5 ${isDark ? "text-[#52525B]" : "text-slate-400"}`}>{a.at}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Related Jobs" icon={ClipboardText} action={<button className={`text-[11.5px] font-semibold ${isDark ? "text-[#60A5FA]" : "text-[#1D4ED8]"}`}>View All</button>}>
            {detail.related.length === 0 ? (
              <div className={`flex items-center justify-center py-6 text-[13px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No related jobs</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {detail.related.map(r => {
                  const inner = (
                    <div className={`rounded-xl border px-3 py-2.5 h-full transition-colors ${isDark ? "border-[#27272A] hover:bg-[#18181B]" : "border-[#E3ECFC] hover:bg-[#F5F8FF]"}`}>
                      <p className={`text-[13px] font-bold m-0 ${isDark ? "text-[#60A5FA]" : "text-[#1D4ED8]"}`}>{r.jobId}</p>
                      <p className={`text-[12px] m-0 mt-0.5 truncate ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{r.label}</p>
                      <span className={`inline-block mt-1.5 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full ${isDark ? "bg-[rgba(16,185,129,0.16)] text-[#34D399]" : "bg-[#DCFCE7] text-[#166534]"}`}>{r.status}</span>
                    </div>
                  );
                  return r.href ? <Link key={r.jobId} href={r.href}>{inner}</Link> : <div key={r.jobId}>{inner}</div>;
                })}
              </div>
            )}
          </Card>
        </div>

      </main>
    </div>
  );
}
