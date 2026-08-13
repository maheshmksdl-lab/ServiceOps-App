"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import InputBase from "@mui/material/InputBase";
import {
  House, CaretRight, CaretLeft, CaretDown, PencilSimple, DotsThreeVertical,
  Printer, Phone, EnvelopeSimple, MapPin, MapTrifold, Star, SealCheck,
  ChatCircleDots, PhoneCall, NavigationArrow, Truck, Plus, Image as ImageIcon,
  Camera, UserSwitch, ClipboardText, FileText, CalendarPlus, XCircle,
  CheckCircle, Circle, Sparkle, CaretRight as CaretRightSm, Trash, UploadSimple,
  Note, Paperclip, WarningCircle, Info, CurrencyInr, Copy, ArrowSquareOut, Lightning,
} from "@phosphor-icons/react";
import EditJobDrawer from "@/components/jobs/EditJobDrawer";
import JobActionDialogs, { type JobDialogKind } from "@/components/jobs/JobActionDialogs";
import JobPrintSheet, { type PrintKind, type PrintPayload } from "@/components/jobs/JobPrintSheet";
import {
  getJobById, STATUS_META, PRIORITY_META, TECHNICIAN_AVATARS, TECHNICIAN_PHONES,
  TECHNICIAN_RATINGS, CUSTOMER_DIRECTORY, ALL_JOBS, JOB_EXTRAS,
  getWorkspace, seedJobPhotos, editJob, updateJob, logActivity, createJob,
  addJobPhotos, removeJobPhoto, addJobNote, removeJobNote,
  addJobAttachments, removeJobAttachment, addJobPart, removeJobPart,
  generateInvoice, setJobChecklist, toEditInput, formatFileSize, nowStamp,
  type JobRecord, type ServiceType, type JobStatus, type EditJobInput, type JobPart,
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

const TABS = [
  "Overview", "Timeline", "Checklist", "Parts & Materials", "Photos",
  "Invoice", "Feedback", "Related Jobs", "Activity Log", "AI Insights",
] as const;
type TabName = typeof TABS[number];

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** "May 26, 2026 09:30 AM" → ["May 26, 2026", "09:30 AM"] for the two-line stat. */
function splitStamp(value: string): [string, string] {
  const m = value.match(/^(.*?)\s(\d{1,2}:\d{2}\s[AP]M)$/);
  return m ? [m[1], m[2]] : [value, ""];
}

function starRating(rating: number, size = 13) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} weight={rating >= i + 1 ? "fill" : rating > i ? "duotone" : "regular"}
          color={rating > i ? "var(--serviceops-primary)" : "#E2E8F0"} />
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
  // Present for jobs raised through the Create Job form — those values win
  // over the per-service-type template defaults.
  const extras = JOB_EXTRAS[job.id];
  const ws = getWorkspace(job.id);

  const customerInfo = CUSTOMER_DIRECTORY[job.customer] ?? {
    phone: `+91 9${(80000000 + job.id * 137) % 10000000}`.padEnd(13, "0"),
    email: `facility@${job.customer.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    address: `${job.customer}, ${REGION_CITY[job.region] ?? "India"} Business District, ${REGION_CITY[job.region] ?? "India"}`,
  };

  const asset = extras?.productModel
    ? `${extras.productModel}${extras.serialNumber ? ` (${extras.serialNumber})` : ""}`
    : isPrimary ? "AC Unit - LG 2 Ton (AC-1045)" : `${tmpl.asset} (${job.serviceType.slice(0, 2).toUpperCase()}-${1000 + job.id})`;
  const warranty = isPrimary ? "Valid Till 12 Dec 2026" : `Valid Till ${(job.id % 28) + 1} ${["Jan", "Mar", "Jun", "Sep", "Nov"][job.id % 5]} 202${6 + (job.id % 3)}`;
  const amcStatus = isPrimary ? "Active (Gold Plan)" : job.id % 3 === 0 ? "Not Enrolled" : `Active (${job.id % 2 === 0 ? "Silver" : "Gold"} Plan)`;

  const doneCount = STEP_DONE_COUNT[job.status] ?? 1;
  const cancelled = job.status === "Cancelled";
  const currentIndex = doneCount < 8 ? doneCount : null;

  const checklistChecked = cancelled ? 0 : Math.max(0, Math.min(CHECKLIST_ITEMS.length, doneCount - 1));

  const parts = [...tmpl.parts, ...ws.extraParts];
  const partsTotal = parts.reduce((s, p) => s + p.qty * p.rate, 0);
  const labor = isPrimary ? 1200 : tmpl.laborCharge;
  const discount = isPrimary ? 325 : job.id % 4 === 0 ? 150 : 0;
  const tax = Math.round((labor + partsTotal) * 0.18);
  const total = labor + partsTotal + tax - discount;
  const paymentStatus = ws.invoice
    ? "Pending"
    : job.status === "Completed" ? (job.id % 3 === 0 ? "Pending" : "Paid") : job.status === "Cancelled" ? "N/A" : "Pending";

  const seedPhotoCount = isPrimary ? 3 : ["In Progress", "On Route", "Completed"].includes(job.status) ? (job.id % 4) + 1 : 0;

  const feedbackRating = isPrimary ? 4.5 : Math.round((3.6 + ((job.id * 7) % 14) / 10) * 10) / 10;
  // NPS-style index: 3.0★ maps to 0, 5.0★ maps to 100.
  const nps = Math.max(-100, Math.min(100, Math.round(((feedbackRating - 3) / 2) * 100)));
  const npsBand = nps >= 80 ? "Excellent" : nps >= 60 ? "Good" : nps >= 30 ? "Fair" : "Needs Work";

  const recs: { text: string; tone: "critical" | "warning" | "good" }[] = isPrimary
    ? [
        { text: "Similar issue reported 3 months ago.", tone: "critical" },
        { text: "AC unit performance dropped by 15%.", tone: "warning" },
        { text: "Recommend preventive maintenance in 12 days.", tone: "good" },
        { text: "Warranty expires in 12 days.", tone: "critical" },
      ]
    : tmpl.recommendations.map((text, i) => ({ text, tone: (["critical", "warning", "good"] as const)[i % 3] }));

  // Activity log — generated from the same step progression as the timeline,
  // then extended with anything the user has done on this screen.
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
  activity.push(...ws.activity);

  // Related jobs are always real records now, so every tile navigates.
  const sameCustomer = ALL_JOBS.filter(j => j.id !== job.id && j.customer === job.customer);
  const sameService = ALL_JOBS.filter(j => j.id !== job.id && j.serviceType === job.serviceType && j.customer !== job.customer);
  const related = [...sameCustomer, ...sameService].slice(0, 12).map(j => ({
    id: j.id, jobId: j.jobId, label: j.serviceType, status: j.status,
    customer: j.customer, sameCustomer: j.customer === job.customer, eta: j.etaLabel,
  }));

  // Alerts surface the highest-signal facts already present elsewhere.
  const breachedSiblings = sameCustomer.filter(j => j.slaBreached).length;
  const alerts: { tone: "critical" | "warning" | "info"; text: string }[] = [];
  if (job.slaBreached) alerts.push({ tone: "critical", text: `SLA breached on ${job.jobId} — escalate to supervisor` });
  if (breachedSiblings > 0) alerts.push({ tone: "critical", text: `SLA breached in ${breachedSiblings} previous job${breachedSiblings > 1 ? "s" : ""} for this customer` });
  const warn = recs.find(r => r.tone === "warning");
  if (warn) alerts.push({ tone: "warning", text: warn.text });
  alerts.push({ tone: "info", text: `Warranty ${warranty.replace("Valid Till", "valid till")}` });
  if (paymentStatus === "Pending" && job.status === "Completed") {
    alerts.push({ tone: "warning", text: "Payment still pending against this job" });
  }

  return {
    customerInfo, asset, warranty, amcStatus,
    problem: extras?.jobTitle || tmpl.problem,
    description: extras?.description ?? "",
    notes: extras?.notes ?? "",
    category: tmpl.category, durationHrs: tmpl.durationHrs,
    doneCount, currentIndex, cancelled, checklistChecked,
    parts, templatePartCount: tmpl.parts.length, partsTotal, labor, discount, tax, total,
    paymentStatus, seedPhotoCount, feedbackRating, nps, npsBand, recs, activity, related, alerts,
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
function Card({ title, icon: Icon, meta, action, footer, bodyClass = "px-4 pb-4", children }: {
  title: string; icon?: React.ElementType; meta?: string; action?: React.ReactNode;
  footer?: React.ReactNode; bodyClass?: string; children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden h-full flex flex-col ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 flex-shrink-0">
        {Icon && (
          <div className={`w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
            <Icon size={13} color={isDark ? "#D4B57B" : "var(--serviceops-primary)"} weight="duotone" />
          </div>
        )}
        <p className={`font-heading text-[14px] font-semibold truncate m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{title}</p>
        {meta && <span className={`text-[11.5px] flex-shrink-0 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{meta}</span>}
        {action && <div className="ml-auto flex-shrink-0">{action}</div>}
      </div>
      <div className={`${bodyClass} flex-1`}>{children}</div>
      {footer && <div className="px-4 pb-3.5 flex-shrink-0">{footer}</div>}
    </div>
  );
}

function CardLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 text-[12px] font-semibold text-[var(--serviceops-primary)] hover:text-[var(--serviceops-action)] transition-colors">
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`flex items-start justify-between gap-3 py-2 border-b last:border-0 ${isDark ? "border-[#18181B]" : "border-[#FBF6E9]"}`}>
      <span className={`text-[12px] font-medium flex-shrink-0 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{label}</span>
      <span className={`text-[13px] font-semibold text-right ${isDark ? "text-[#E4E4E7]" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function MapPreview() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`relative rounded-xl overflow-hidden h-[230px] border ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}
      style={{
        backgroundColor: isDark ? "#15100A" : "var(--serviceops-surface)",
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(245,158,11,0.15)"} 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(245,158,11,0.15)"} 28px), repeating-linear-gradient(90deg, transparent, transparent 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(245,158,11,0.15)"} 27px, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(245,158,11,0.15)"} 28px)`,
      }}>
      <svg viewBox="0 0 400 230" className="absolute inset-0 w-full h-full">
        <path d="M40,190 C90,160 100,110 150,95 C200,80 220,50 260,35" fill="none" stroke="var(--serviceops-primary)" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" opacity="0.85" />
        <circle cx="40" cy="190" r="6" fill={isDark ? "#0A0A0A" : "#fff"} stroke="var(--serviceops-primary)" strokeWidth="2.5" />
        <circle cx="260" cy="35" r="5" fill="#EF4444" />
      </svg>
      <div className="absolute" style={{ left: "30%", top: "38%" }}>
        <div className="w-7 h-7 rounded-full bg-[var(--serviceops-primary)] flex items-center justify-center shadow-lg ring-4 ring-[rgba(245,158,11,0.22)]">
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

function NpsGauge({ value, band }: { value: number; band: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pct = Math.max(0, Math.min(100, value));
  const r = 30;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative w-[76px] h-[76px] flex-shrink-0">
      <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7"
          stroke={isDark ? "#27272A" : "var(--serviceops-tint)"} />
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          stroke="var(--serviceops-primary)"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[17px] font-extrabold leading-none ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{value}</span>
        <span className={`text-[9.5px] mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{band}</span>
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

  // Every mutation happens against the shared dataset; bumping this pulls the
  // fresh record back through the memos below.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const job = useMemo(() => getJobById(jobId), [jobId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const detail = useMemo(() => job ? buildDetail(job) : null, [job, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const ws = job ? getWorkspace(job.id) : null;

  const [tab, setTab] = useState<TabName>("Overview");
  const [printAnchor, setPrintAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor]   = useState<HTMLElement | null>(null);
  const [editOpen, setEditOpen]       = useState(false);
  const [dialog, setDialog]           = useState<JobDialogKind>(null);
  const [fullDetailsOpen, setFullDetailsOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; name: string } | null>(null);
  const [printPayload, setPrintPayload] = useState<PrintPayload | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<{ msg: string; href?: string } | null>(null);

  const photoInput  = useRef<HTMLInputElement>(null);
  const fileInput   = useRef<HTMLInputElement>(null);
  const trackingRef = useRef<HTMLDivElement>(null);

  // Materialise the job's existing site photos once so uploads/deletes work
  // against a single list.
  useEffect(() => {
    if (!job || !detail) return;
    seedJobPhotos(job.id, detail.seedPhotoCount);
    refresh();
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = (msg: string, href?: string) => setToast({ msg, href });

  // ── Print ────────────────────────────────────
  const buildPrintPayload = useCallback((kind: PrintKind): PrintPayload | null => {
    if (!job || !detail || !ws) return null;
    const checked = ws.checklist ?? CHECKLIST_ITEMS.map((_, i) => i < detail.checklistChecked);
    return {
      kind, job,
      customer: detail.customerInfo,
      problem: detail.problem, category: detail.category, asset: detail.asset,
      warranty: detail.warranty, amcStatus: detail.amcStatus, durationHrs: detail.durationHrs,
      description: detail.description, notes: detail.notes,
      parts: detail.parts, labor: detail.labor, partsTotal: detail.partsTotal,
      tax: detail.tax, discount: detail.discount, total: detail.total,
      paymentStatus: detail.paymentStatus,
      invoiceNumber: ws.invoice?.number ?? null,
      checklist: CHECKLIST_ITEMS.map((label, i) => ({ label, done: !!checked[i] })),
      timeline: STEP_ORDER.map((label, i) => ({ label, done: !detail.cancelled && i < detail.doneCount })),
      printedAt: nowStamp(),
    };
  }, [job, detail, ws]);

  const handlePrint = (kind: PrintKind) => {
    const payload = buildPrintPayload(kind);
    if (!payload) return;
    setPrintPayload(payload);
    setPrintAnchor(null);
    // Let the sheet commit to the DOM before handing off to the browser.
    window.setTimeout(() => {
      window.print();
      logActivity(payload.job.id, `${kind === "invoice" ? "Invoice" : "Job card"} printed`);
      refresh();
    }, 80);
  };

  if (!job || !detail || !ws) {
    return (
      <div className="sidebar-content flex-1 flex flex-col min-h-screen overflow-auto">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xl font-bold mb-2 ${isDark ? "text-[#D4D4D8]" : "text-[var(--serviceops-depth)]"}`}>Job not found</div>
            <button onClick={() => router.push("/jobs")} className={`text-sm underline ${isDark ? "text-[#A1A1AA]" : "text-[var(--serviceops-primary)]"}`}>Back to Jobs</button>
          </div>
        </div>
      </div>
    );
  }

  const activeChecklist = ws.checklist ?? CHECKLIST_ITEMS.map((_, i) => i < detail.checklistChecked);
  const toggleChecklist = (i: number) => {
    const next = [...activeChecklist];
    next[i] = !next[i];
    setJobChecklist(job.id, next);
    refresh();
  };

  const statusColor = isDark ? STATUS_META[job.status].dark : STATUS_META[job.status].light;
  const statusBg = isDark ? STATUS_META[job.status].bgDark : STATUS_META[job.status].bgLight;
  const priorityMeta = PRIORITY_META[job.priority];
  const sla = slaInfo(job, job.id === 1);
  const techRating = TECHNICIAN_RATINGS[job.technician];
  const [createdDate, createdTime] = splitStamp(job.createdAt);

  const showLiveTracking = () => {
    setTab("Overview");
    window.setTimeout(() => trackingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  // ── Action handlers ──────────────────────────
  const handleEditSave = (input: EditJobInput) => {
    editJob(job.id, input);
    refresh();
    notify(`${job.jobId} updated`);
  };

  const handleAssign = (technician: string) => {
    updateJob(job.id, { technician });
    logActivity(job.id, `Technician reassigned to ${technician}`);
    refresh();
    notify(`Assigned to ${technician}`);
  };

  const handleStatus = (status: JobStatus) => {
    updateJob(job.id, { status });
    logActivity(job.id, `Status changed to ${status}`);
    refresh();
    notify(`Status set to ${status}`);
  };

  const handleInvoice = () => {
    const inv = generateInvoice(job.id);
    refresh();
    setTab("Invoice");
    notify(`${inv.number} generated`);
  };

  const handleFollowUp = (when: string, note: string) => {
    const extras = JOB_EXTRAS[job.id];
    const contact = detail.customerInfo;
    const followUp = createJob({
      customer: job.customer,
      address: contact.address, email: contact.email, city: "", phone: contact.phone,
      state: "", pincode: "", region: job.region,
      serviceType: job.serviceType, priority: job.priority, status: "Scheduled",
      jobTitle: `Follow-up · ${detail.problem}`,
      description: note || `Follow-up visit for ${job.jobId}.`,
      scheduleStart: when, scheduleEnd: when,
      technician: job.technician,
      productModel: extras?.productModel ?? "", serialNumber: extras?.serialNumber ?? "",
      notes: `Raised from ${job.jobId}.`,
    });
    logActivity(job.id, `Follow-up ${followUp.jobId} scheduled`);
    refresh();
    notify(`Follow-up ${followUp.jobId} scheduled`, `/jobs/${followUp.id}`);
  };

  const handleCloseJob = (resolution: string) => {
    updateJob(job.id, { status: "Completed" });
    setJobChecklist(job.id, CHECKLIST_ITEMS.map(() => true));
    logActivity(job.id, resolution.trim() ? `Job closed — ${resolution.trim()}` : "Job closed");
    refresh();
    notify(`${job.jobId} closed`);
  };

  const handleAddPart = (part: JobPart) => {
    addJobPart(job.id, part);
    refresh();
    notify(`${part.item} added`);
  };

  const handleDuplicate = () => {
    const extras = JOB_EXTRAS[job.id];
    const contact = detail.customerInfo;
    const copy = createJob({
      customer: job.customer,
      address: contact.address, email: contact.email, city: "", phone: contact.phone,
      state: "", pincode: "", region: job.region,
      serviceType: job.serviceType, priority: job.priority, status: "Scheduled",
      jobTitle: detail.problem, description: detail.description,
      scheduleStart: extras?.scheduleStart ?? "", scheduleEnd: extras?.scheduleEnd ?? "",
      technician: job.technician,
      productModel: extras?.productModel ?? "", serialNumber: extras?.serialNumber ?? "",
      notes: `Duplicated from ${job.jobId}.`,
    });
    setMoreAnchor(null);
    notify(`Duplicated as ${copy.jobId}`, `/jobs/${copy.id}`);
  };

  const handleCancelJob = () => {
    updateJob(job.id, { status: "Cancelled" });
    logActivity(job.id, "Job cancelled");
    setMoreAnchor(null);
    refresh();
    notify(`${job.jobId} cancelled`);
  };

  const handlePhotoFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (images.length === 0) return;
    Promise.all(images.map(file => new Promise<{ name: string; src: string }>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, src: String(reader.result ?? "") });
      reader.readAsDataURL(file);
    }))).then(loaded => {
      addJobPhotos(job.id, loaded);
      refresh();
      notify(`${loaded.length} photo${loaded.length > 1 ? "s" : ""} added`);
    });
  };

  const handleAttachmentFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    addJobAttachments(job.id, Array.from(files).map(f => ({ name: f.name, size: formatFileSize(f.size) })));
    refresh();
    notify(`${files.length} file${files.length > 1 ? "s" : ""} attached`);
  };

  const submitNote = () => {
    if (!noteDraft.trim()) return;
    addJobNote(job.id, noteDraft);
    setNoteDraft("");
    refresh();
  };

  const QUICK_ACTIONS = [
    { label: "Assign Technician",  icon: UserSwitch,   color: "var(--serviceops-primary)", onClick: () => setDialog("assign") },
    { label: "Change Status",      icon: PencilSimple, color: "#8B5CF6",                   onClick: () => setDialog("status") },
    { label: "Generate Invoice",   icon: FileText,     color: "#10B981",                   onClick: () => setDialog("invoice") },
    { label: "Schedule Follow-up", icon: CalendarPlus, color: "var(--serviceops-action)",  onClick: () => setDialog("followUp") },
    { label: "Close Job",          icon: XCircle,      color: "#EF4444",                   onClick: () => setDialog("close") },
    { label: "More Actions",       icon: DotsThreeVertical, color: "#64748B",              onClick: (e?: React.MouseEvent<HTMLElement>) => setMoreAnchor(e?.currentTarget ?? null) },
  ];

  const ALERT_TONE = {
    critical: { color: "#EF4444", bg: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2", icon: XCircle },
    warning:  { color: "var(--serviceops-primary)", bg: isDark ? "rgba(251,191,36,0.12)" : "var(--serviceops-surface)", icon: WarningCircle },
    info:     { color: isDark ? "#D4B57B" : "var(--serviceops-depth)", bg: isDark ? "#1C1710" : "var(--serviceops-tint)", icon: Info },
  } as const;

  // ── Tab panels ───────────────────────────────
  const timelinePanel = (
    <div className="relative">
      <div className={`absolute left-[10px] top-1 bottom-1 w-px ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-soft)]"}`} />
      <div className="space-y-3.5">
        {STEP_ORDER.map((step, i) => {
          const done = !detail.cancelled && i < detail.doneCount;
          const current = !detail.cancelled && i === detail.currentIndex;
          const skipped = detail.cancelled && i > 0;
          return (
            <div key={step} className="flex items-start gap-3 relative">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                done ? "bg-emerald-500" : current ? "bg-[var(--serviceops-primary)]" : isDark ? "bg-[#18181B] border border-[#27272A]" : "bg-white border border-[var(--serviceops-soft)]"
              }`}>
                {done ? <CheckCircle size={12} color="#fff" weight="fill" /> : current ? <span className="w-2 h-2 rounded-full bg-white" /> : <Circle size={8} color={isDark ? "#3F3F46" : "#CBD5E1"} weight="fill" />}
              </div>
              <div className="flex-1 pt-0.5">
                <p className={`text-[13px] font-semibold m-0 ${skipped ? (isDark ? "text-[#3F3F46]" : "text-slate-300") : done || current ? (isDark ? "text-[#E4E4E7]" : "text-slate-700") : (isDark ? "text-[#52525B]" : "text-slate-300")}`}>{step}</p>
                {(done || current || i === 0) && (
                  <p className={`text-[11px] m-0 mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                    {detail.activity[i]?.at ?? job.createdAt}
                  </p>
                )}
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
  );

  const checklistPanel = (
    <div className="space-y-0.5 -mx-1">
      {CHECKLIST_ITEMS.map((item, i) => (
        <label key={item} className={`flex items-center gap-1.5 px-1 py-1 rounded-lg cursor-pointer transition-colors ${isDark ? "hover:bg-[#18181B]" : "hover:bg-[var(--serviceops-surface)]"}`}>
          <Checkbox size="small" checked={!!activeChecklist[i]} onChange={() => toggleChecklist(i)}
            sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#CBD5E1", "&.Mui-checked": { color: "#10B981" } }} />
          <span className={`text-[13px] ${activeChecklist[i] ? (isDark ? "text-[#71717A] line-through" : "text-slate-400 line-through") : (isDark ? "text-[#D4D4D8]" : "text-slate-700")}`}>{item}</span>
        </label>
      ))}
    </div>
  );

  const partsPanel = (
    <>
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className={isDark ? "text-[#71717A]" : "text-slate-400"}>
            <th className="text-left font-semibold pb-1.5">Item</th>
            <th className="text-right font-semibold pb-1.5">Qty</th>
            <th className="text-right font-semibold pb-1.5">Rate (₹)</th>
            <th className="text-right font-semibold pb-1.5">Amount (₹)</th>
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {detail.parts.map((p, i) => {
            const isExtra = i >= detail.templatePartCount;
            return (
              <tr key={`${p.item}-${i}`} className={`border-t group ${isDark ? "border-[#18181B]" : "border-[#FBF6E9]"}`}>
                <td className={`py-1.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{p.item}</td>
                <td className={`py-1.5 text-right ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{p.qty}</td>
                <td className={`py-1.5 text-right ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{p.rate.toLocaleString("en-IN")}</td>
                <td className={`py-1.5 text-right font-semibold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{(p.qty * p.rate).toLocaleString("en-IN")}</td>
                <td className="py-1.5 text-right">
                  {isExtra && (
                    <Tooltip title="Remove item">
                      <IconButton size="small" className="opacity-0 group-hover:opacity-100"
                        onClick={() => { removeJobPart(job.id, i - detail.templatePartCount); refresh(); }}
                        sx={{ p: 0.3, transition: "opacity 0.15s" }}>
                        <Trash size={12} color="#EF4444" weight="duotone" />
                      </IconButton>
                    </Tooltip>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className={`border-t ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}>
            <td colSpan={3} className={`py-2 text-right text-[12px] font-semibold ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>Parts Total</td>
            <td className={`py-2 text-right font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{detail.partsTotal.toLocaleString("en-IN")}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <button onClick={() => setDialog("addPart")}
        className="flex items-center gap-1.5 mt-3 text-[12.5px] font-semibold text-[var(--serviceops-primary)] hover:text-[var(--serviceops-action)] transition-colors">
        <Plus size={13} weight="bold" /> Add Item
      </button>
    </>
  );

  const photosPanel = (
    <>
      {ws.photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {ws.photos.map(photo => (
            <div key={photo.id} className="relative group">
              <button onClick={() => photo.src && setPhotoPreview({ src: photo.src, name: photo.name })}
                className={`w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center border ${isDark ? "bg-[#18181B] border-[#27272A]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"} ${photo.src ? "cursor-zoom-in" : "cursor-default"}`}>
                {photo.src
                  // Data-URL thumbnails from the file picker — next/image can't optimise these.
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={photo.src} alt={photo.name} className="w-full h-full object-cover" />
                  : <ImageIcon size={20} color={isDark ? "#3F3F46" : "#B88B54"} weight="duotone" />}
              </button>
              <Tooltip title="Remove photo">
                <IconButton size="small"
                  onClick={() => { removeJobPhoto(job.id, photo.id); refresh(); }}
                  sx={{
                    position: "absolute", top: 4, right: 4, p: 0.4, opacity: 0,
                    bgcolor: "rgba(0,0,0,0.55)", transition: "opacity 0.15s",
                    ".group:hover &": { opacity: 1 },
                    "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                  }}>
                  <Trash size={12} color="#fff" weight="bold" />
                </IconButton>
              </Tooltip>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center py-8 gap-1 text-[13px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>
          <Camera size={26} weight="duotone" />
          No photos yet
        </div>
      )}
      <input ref={photoInput} type="file" accept="image/*" multiple hidden
        onChange={e => { handlePhotoFiles(e.target.files); e.target.value = ""; }} />
      <button onClick={() => photoInput.current?.click()}
        className="flex items-center gap-1.5 mt-3 text-[12.5px] font-semibold text-[var(--serviceops-primary)] hover:text-[var(--serviceops-action)] transition-colors">
        <Plus size={13} weight="bold" /> Add Photos
      </button>
    </>
  );

  const invoicePanel = (
    <div className="space-y-1.5">
      {ws.invoice && (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-3 ${isDark ? "bg-[#1C1710]" : "bg-[var(--serviceops-tint)]"}`}>
          <div>
            <p className={`m-0 text-[13px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{ws.invoice.number}</p>
            <p className={`m-0 text-[11px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Generated {ws.invoice.generatedAt}</p>
          </div>
          <Button size="small" startIcon={<Printer size={13} weight="duotone" />} onClick={() => handlePrint("invoice")}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.76rem", color: "var(--serviceops-primary)", borderRadius: "8px" }}>
            Print
          </Button>
        </div>
      )}
      {([["Labour Charges", detail.labor], ["Parts & Materials", detail.partsTotal], ["Tax (18%)", detail.tax], ["Discount", -detail.discount]] as [string, number][]).map(([label, val]) => (
        <div key={label} className="flex items-center justify-between text-[13px]">
          <span className={isDark ? "text-[#A1A1AA]" : "text-slate-500"}>{label}</span>
          <span className={isDark ? "text-[#D4D4D8]" : "text-slate-700"}>{val < 0 ? "-" : ""}{money(Math.abs(val))}</span>
        </div>
      ))}
      <div className={`flex items-center justify-between pt-2 mt-1 border-t ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}>
        <span className={`text-[14px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>Total Amount</span>
        <span className={`text-[16px] font-extrabold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{money(detail.total)}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className={`text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Payment Status</span>
        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: detail.paymentStatus === "Paid" ? (isDark ? "rgba(16,185,129,0.16)" : "#DCFCE7") : detail.paymentStatus === "N/A" ? (isDark ? "#27272A" : "#F1F5F9") : (isDark ? "rgba(245,158,11,0.16)" : "var(--serviceops-tint)"),
            color: detail.paymentStatus === "Paid" ? "#10B981" : detail.paymentStatus === "N/A" ? "#94A3B8" : "#D97706",
          }}>{detail.paymentStatus}</span>
      </div>
      {!ws.invoice && (
        <Button fullWidth variant="outlined" size="small" startIcon={<FileText size={14} weight="duotone" />}
          onClick={() => setDialog("invoice")}
          sx={{
            mt: 2, borderColor: isDark ? "#27272A" : "var(--serviceops-soft)",
            color: isDark ? "#D4D4D8" : "var(--serviceops-primary)",
            borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.8rem",
            "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0A0A0A" : "var(--serviceops-tint)" },
          }}>
          Generate Invoice
        </Button>
      )}
    </div>
  );

  const relatedPanel = (limit?: number) => {
    const rows = limit ? detail.related.slice(0, limit) : detail.related;
    return rows.length === 0 ? (
      <div className={`flex items-center justify-center py-6 text-[13px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No related jobs</div>
    ) : (
      <div className={`grid grid-cols-1 ${limit ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"} gap-2`}>
        {rows.map(r => {
          const meta = STATUS_META[r.status as JobStatus];
          return (
            <Link key={r.jobId} href={`/jobs/${r.id}`}
              className={`rounded-xl border px-3 py-2.5 h-full transition-colors block ${isDark ? "border-[#27272A] hover:bg-[#18181B]" : "border-[var(--serviceops-soft)] hover:bg-[var(--serviceops-tint)]"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold m-0 text-[var(--serviceops-primary)]">{r.jobId}</p>
                {!r.sameCustomer && <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${isDark ? "bg-[#27272A] text-[#A1A1AA]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-depth)]"}`}>Same type</span>}
              </div>
              <p className={`text-[12px] m-0 mt-0.5 truncate ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{r.label}</p>
              {!r.sameCustomer && <p className={`text-[11px] m-0 truncate ${isDark ? "text-[#52525B]" : "text-slate-400"}`}>{r.customer}</p>}
              <span className="inline-block mt-1.5 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: isDark ? meta.bgDark : meta.bgLight, color: isDark ? meta.dark : meta.light }}>
                {r.status}
              </span>
            </Link>
          );
        })}
      </div>
    );
  };

  const feedbackPanel = (
    <>
      <div className="flex items-start gap-8">
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-medium mb-2 ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>Overall Rating</p>
          {starRating(detail.feedbackRating, 18)}
          <p className={`text-[16px] font-bold mt-2 m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{detail.feedbackRating}/5</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-medium mb-1 ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>NPS Score</p>
          <NpsGauge value={detail.nps} band={detail.npsBand} />
        </div>
      </div>
    </>
  );

  const aiPanel = (
    <div className="space-y-2.5">
      {detail.recs.map((r, i) => {
        const color = r.tone === "critical" ? "#EF4444" : r.tone === "warning" ? "var(--serviceops-primary)" : "#10B981";
        return (
          <div key={i} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
            <span className={`text-[13px] leading-snug ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{r.text}</span>
          </div>
        );
      })}
    </div>
  );

  const activityPanel = (limit?: number) => {
    const rows = limit ? detail.activity.slice(-limit).reverse() : [...detail.activity].reverse();
    return (
      <div className="space-y-3">
        {rows.map((a, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isDark ? "bg-[#3F3F46]" : "bg-[var(--serviceops-soft)]"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] m-0 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{a.label}</p>
              <p className={`text-[11px] m-0 mt-0.5 ${isDark ? "text-[#52525B]" : "text-slate-400"}`}>{a.at}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const summaryPanel = (
    <>
      <div className="space-y-0">
        <InfoRow label="Job ID" value={job.jobId} />
        <div className={`flex items-center justify-between gap-3 py-2 border-b ${isDark ? "border-[#18181B]" : "border-[#FBF6E9]"}`}>
          <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Priority</span>
          <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isDark ? priorityMeta.bgDark : priorityMeta.bg, color: isDark ? priorityMeta.textDark : priorityMeta.text }}>{job.priority}</span>
        </div>
        <div className={`flex items-center justify-between gap-3 py-2 border-b ${isDark ? "border-[#18181B]" : "border-[#FBF6E9]"}`}>
          <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Status</span>
          <span className="text-[13px] font-semibold" style={{ color: statusColor }}>{job.status}</span>
        </div>
        <div className={`flex items-center justify-between gap-3 py-2 border-b ${isDark ? "border-[#18181B]" : "border-[#FBF6E9]"}`}>
          <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>SLA</span>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`h-1.5 w-16 rounded-full overflow-hidden ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
              <div className="h-full rounded-full" style={{ width: `${sla.pct}%`, backgroundColor: sla.tone === "critical" ? "#EF4444" : sla.tone === "good" ? "#10B981" : "var(--serviceops-primary)" }} />
            </div>
            <span className={`text-[12px] font-semibold whitespace-nowrap ${sla.tone === "critical" ? "text-red-500" : isDark ? "text-[#E4E4E7]" : "text-slate-700"}`}>{sla.label}</span>
          </div>
        </div>
        <InfoRow label="Service Type" value={job.serviceType} />
        <InfoRow label="Technician" value={job.technician} />
        <InfoRow label="ETA" value={job.etaLabel} />
      </div>
    </>
  );

  const alertsPanel = (
    <div className="space-y-2">
      {detail.alerts.map((a, i) => {
        const tone = ALERT_TONE[a.tone];
        const Icon = tone.icon;
        return (
          <div key={i} className="flex items-start gap-2 rounded-xl px-2.5 py-2" style={{ backgroundColor: tone.bg }}>
            <Icon size={14} color={tone.color} weight="fill" className="mt-[1px] flex-shrink-0" />
            <span className={`text-[12.5px] leading-snug ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{a.text}</span>
          </div>
        );
      })}
    </div>
  );

  // ── Render ───────────────────────────────────
  return (
    <div className="sidebar-content flex-1 flex flex-col min-h-screen overflow-auto">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 animate-fade-in">

        {/* ══ Breadcrumb + title + actions ══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className={`flex items-center gap-1.5 text-[13px] mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
              <House size={14} weight="duotone" />
              <CaretRight size={11} weight="duotone" />
              <Link href="/jobs" className={`transition-colors font-medium ${isDark ? "hover:text-[#D4D4D8]" : "hover:text-[var(--serviceops-primary)]"}`}>Jobs</Link>
              <CaretRight size={11} weight="duotone" />
              <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-[var(--serviceops-primary)]"}`}>{job.jobId}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/jobs")} className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? "hover:bg-[#27272A] text-[#A1A1AA]" : "hover:bg-[var(--serviceops-tint)] text-slate-500"}`}>
                <CaretLeft size={16} weight="bold" />
              </button>
              <h1 className={`text-[19px] sm:text-[21px] font-extrabold tracking-tight m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>Job Details</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="small" variant="outlined" startIcon={<PencilSimple size={13} weight="duotone" />}
              onClick={() => setEditOpen(true)}
              sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)", color: isDark ? "#D4D4D8" : "var(--serviceops-primary)", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0A0A0A" : "var(--serviceops-tint)" } }}>
              Edit Job
            </Button>
            <Button size="small" variant="outlined" endIcon={<CaretDown size={11} weight="bold" />} startIcon={<Printer size={13} weight="duotone" />}
              onClick={e => setPrintAnchor(e.currentTarget)}
              sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)", color: isDark ? "#D4D4D8" : "#334155", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0A0A0A" : "var(--serviceops-tint)" } }}>
              Print
            </Button>
            <Menu anchorEl={printAnchor} open={Boolean(printAnchor)} onClose={() => setPrintAnchor(null)}
              PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, minWidth: 180 } }}>
              <MenuItem onClick={() => handlePrint("card")} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>
                <ListItemIcon sx={{ minWidth: 28 }}><ClipboardText size={15} weight="duotone" /></ListItemIcon>
                Print Job Card
              </MenuItem>
              <MenuItem onClick={() => handlePrint("invoice")} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>
                <ListItemIcon sx={{ minWidth: 28 }}><CurrencyInr size={15} weight="duotone" /></ListItemIcon>
                Print Invoice
              </MenuItem>
            </Menu>
            <Tooltip title="More actions">
              <IconButton size="small" onClick={e => setMoreAnchor(e.currentTarget)}
                sx={{ border: `1.5px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, borderRadius: "9px", bgcolor: isDark ? "#0F0F0F" : "transparent", p: 0.85, "&:hover": { borderColor: "var(--serviceops-primary)", bgcolor: isDark ? "#0A0A0A" : "var(--serviceops-tint)" } }}>
                <DotsThreeVertical size={16} weight="bold" color={isDark ? "#B4B5B6" : "#64748B"} />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}
              PaperProps={{ sx: { borderRadius: "12px", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`, minWidth: 200 } }}>
              <MenuItem onClick={() => { setMoreAnchor(null); setEditOpen(true); }} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>
                <ListItemIcon sx={{ minWidth: 28 }}><PencilSimple size={15} weight="duotone" /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Edit Job</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDuplicate} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>
                <ListItemIcon sx={{ minWidth: 28 }}><Copy size={15} weight="duotone" /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Duplicate Job</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setMoreAnchor(null); handlePrint("card"); }} sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px" }}>
                <ListItemIcon sx={{ minWidth: 28 }}><Printer size={15} weight="duotone" /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "13.5px" }}>Print Job Card</ListItemText>
              </MenuItem>
              <Divider sx={{ my: 0.5, borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />
              <MenuItem onClick={handleCancelJob} disabled={job.status === "Cancelled"}
                sx={{ mx: 0.5, borderRadius: "8px", fontSize: "13.5px", color: "#EF4444" }}>
                <ListItemIcon sx={{ minWidth: 28 }}><XCircle size={15} color="#EF4444" weight="duotone" /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: "13.5px", color: "#EF4444" }}>Cancel Job</ListItemText>
              </MenuItem>
            </Menu>
          </div>
        </div>

        {/* ══ Sub-info bar ══ */}
        <div className={`rounded-2xl border shadow-sm px-5 py-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
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
            <p className={`text-[13px] font-semibold m-0 mb-1.5 ${sla.tone === "critical" ? "text-red-500" : sla.tone === "good" ? "text-emerald-500" : isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{sla.label}</p>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
              <div className="h-full rounded-full" style={{ width: `${sla.pct}%`, backgroundColor: sla.tone === "critical" ? "#EF4444" : sla.tone === "good" ? "#10B981" : "var(--serviceops-primary)" }} />
            </div>
          </div>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Created On</p>
            <p className={`text-[13.5px] font-semibold m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{createdDate}</p>
            <p className={`text-[12px] m-0 ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>{createdTime}</p>
          </div>
        </div>

        {/* ══ Content grid — four tracks: the two wide info cards, then the
              narrow technician / sidebar columns. Every row below places
              itself on these same tracks so edges line up down the page. ══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.6fr_1.6fr_1fr_1fr] gap-4 pb-6">

          {/* ── Row 1 ── */}
          <Card title="Customer" icon={ClipboardText}
            footer={
              <a href={`https://maps.google.com/?q=${encodeURIComponent(detail.customerInfo.address)}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--serviceops-primary)] hover:text-[var(--serviceops-action)] transition-colors">
                <MapTrifold size={14} weight="duotone" /> View on Map
              </a>
            }>
            <p className={`font-heading text-[15px] font-bold mb-2.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{job.customer}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px]">
                <Phone size={13} color="#B88B54" weight="duotone" />
                <a href={`tel:${detail.customerInfo.phone.replace(/\s/g, "")}`} className={`hover:underline ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{detail.customerInfo.phone}</a>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <EnvelopeSimple size={13} color="#B88B54" weight="duotone" />
                <a href={`mailto:${detail.customerInfo.email}`} className={`truncate hover:underline ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{detail.customerInfo.email}</a>
              </div>
              <div className="flex items-start gap-2 text-[13px]">
                <MapPin size={13} color="#B88B54" weight="duotone" className="mt-0.5 flex-shrink-0" />
                <span className={isDark ? "text-[#D4D4D8]" : "text-slate-600"}>{detail.customerInfo.address}</span>
              </div>
            </div>
          </Card>

          <Card title="Service Information" icon={Sparkle}>
            <InfoRow label="Service Type" value={job.serviceType} />
            <InfoRow label="Problem Reported" value={detail.problem} />
            <InfoRow label="Category" value={detail.category} />
            <InfoRow label="Asset" value={detail.asset} />
            <InfoRow label="Warranty" value={detail.warranty} />
            <InfoRow label="AMC Status" value={detail.amcStatus} />
            <InfoRow label="Expected Duration" value={`${detail.durationHrs} Hours`} />
            {detail.description && <InfoRow label="Description" value={detail.description} />}
            {detail.notes && <InfoRow label="Notes" value={detail.notes} />}
          </Card>

          <Card title="Assigned Technician" icon={UserSwitch}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={TECHNICIAN_AVATARS[job.technician]} sx={{ width: 44, height: 44 }} />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className={`text-[14.5px] font-bold m-0 truncate ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{job.technician}</p>
                  <SealCheck size={14} color="var(--serviceops-primary)" weight="fill" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {starRating(techRating.rating, 11)}
                  <span className={`text-[11.5px] ml-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{techRating.rating} · ({techRating.jobs} Jobs)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] mb-3">
              <Phone size={13} color="#B88B54" weight="duotone" />
              <a href={`tel:${TECHNICIAN_PHONES[job.technician].replace(/\s/g, "")}`} className={`hover:underline ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{TECHNICIAN_PHONES[job.technician]}</a>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />{TECH_STATUS_LABEL[job.status]}
              </span>
              <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>ETA {job.etaLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={showLiveTracking}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#18181B] text-[#D4D4D8] hover:bg-[#27272A]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-primary)] hover:bg-[var(--serviceops-soft)]"}`}>
                <NavigationArrow size={15} weight="duotone" />Live Location
              </button>
              <a href={`tel:${TECHNICIAN_PHONES[job.technician].replace(/\s/g, "")}`}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#18181B] text-[#D4D4D8] hover:bg-[#27272A]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-primary)] hover:bg-[var(--serviceops-soft)]"}`}>
                <PhoneCall size={15} weight="duotone" />Call
              </a>
              <Link href="/comms"
                className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#18181B] text-[#D4D4D8] hover:bg-[#27272A]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-primary)] hover:bg-[var(--serviceops-soft)]"}`}>
                <ChatCircleDots size={15} weight="duotone" />Chat
              </Link>
            </div>
          </Card>

          <Card title="Quick Actions" icon={Lightning}>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map(({ label, icon: Icon, color, onClick }) => (
                <button key={label} onClick={e => onClick(e)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-center transition-colors ${isDark ? "hover:bg-[#18181B]" : "hover:bg-[var(--serviceops-surface)]"}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                    <Icon size={15} color={color} weight="duotone" />
                  </div>
                  <span className={`text-[10.5px] font-medium leading-tight ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{label}</span>
                </button>
              ))}
            </div>
          </Card>
          {/* ── Row 2: tab strip + active panel, spanning the three left tracks.
                 The strip is bare (no card) and lays its ten tabs out edge to
                 edge from lg up, so it never needs to scroll at desktop widths. ── */}
          <div className="md:col-span-2 xl:col-span-3 space-y-4 min-w-0">
            {/* Each tab is a flex cell that grows to fill the strip, so the ten
                labels spread evenly like the reference and never need a
                scrollbar — they wrap to a second line only if the column gets
                genuinely too narrow for them. */}
            <div className={`flex flex-wrap items-center border-b ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}>
              {TABS.map(t => {
                const active = t === tab;
                return (
                  <button key={t} onClick={() => setTab(t)}
                    className={`relative flex-1 min-w-max px-2 pb-2.5 pt-1 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                      active
                        ? "text-[var(--serviceops-primary)]"
                        : isDark ? "text-[#71717A] hover:text-[#D4D4D8]" : "text-slate-500 hover:text-slate-700"
                    }`}>
                    {t}
                    {active && <span className="absolute left-0 right-0 -bottom-px h-[2.5px] rounded-t-full bg-[var(--serviceops-primary)]" />}
                  </button>
                );
              })}
            </div>

            {tab === "Overview" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div ref={trackingRef} className="min-w-0">
                  <Card title="Live Tracking"><MapPreview /></Card>
                </div>
                <Card title="Job Timeline" meta={`(Current Status: ${job.status})`}>
                  {timelinePanel}
                </Card>
                <Card title="Summary"
                  footer={<CardLink onClick={() => setFullDetailsOpen(true)}>View Full Details <CaretRightSm size={11} weight="bold" /></CardLink>}>
                  {summaryPanel}
                </Card>
              </div>
            ) : (
              <div className={`rounded-2xl border shadow-sm px-4 py-4 ${isDark ? "bg-[#0A0A0A] border-[#27272A]" : "bg-white border-[var(--serviceops-soft)]"}`}>
                {tab === "Timeline" && (
                  <>
                    <p className={`font-heading text-[14px] font-semibold mb-3 m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>
                      Job Timeline <span className={isDark ? "text-[#71717A]" : "text-slate-400"}>(Current Status: {job.status})</span>
                    </p>
                    {timelinePanel}
                  </>
                )}
                {tab === "Checklist" && checklistPanel}
                {tab === "Parts & Materials" && partsPanel}
                {tab === "Photos" && photosPanel}
                {tab === "Invoice" && <div className="max-w-md">{invoicePanel}</div>}
                {tab === "Feedback" && feedbackPanel}
                {tab === "Related Jobs" && relatedPanel()}
                {tab === "Activity Log" && activityPanel()}
                {tab === "AI Insights" && aiPanel}
              </div>
            )}
          </div>

          {/* ── Sidebar: notes + attachments, on the fourth track ── */}
          <div className="md:col-span-2 xl:col-span-1 space-y-4 min-w-0">
            <Card title="Job Notes" icon={Note} meta={ws.notes.length ? `${ws.notes.length}` : undefined}>
              <div className={`rounded-xl border px-3 py-2 mb-2 transition-colors focus-within:border-[var(--serviceops-primary)] ${isDark ? "bg-[#0F0F0F] border-[#27272A]" : "bg-[var(--serviceops-surface)] border-[var(--serviceops-soft)]"}`}>
                <InputBase fullWidth multiline minRows={2} placeholder="Add internal note…"
                  value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote(); }}
                  sx={{ fontSize: "12.5px", color: isDark ? "#D4D4D8" : "#334155", "& textarea::placeholder": { color: isDark ? "#52525B" : "#B88B54", opacity: 1 } }} />
              </div>
              <div className="flex justify-end">
                <Button size="small" variant="contained" onClick={submitNote} disabled={!noteDraft.trim()}
                  sx={{
                    bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)", color: isDark ? "#F4F4F5" : "#3B1F00",
                    borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.75rem", px: 2, boxShadow: "none",
                    "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" },
                    "&.Mui-disabled": { bgcolor: isDark ? "#18181B" : "var(--serviceops-tint)", color: isDark ? "#52525B" : "#B88B54" },
                  }}>
                  Add Note
                </Button>
              </div>

              {ws.notes.length > 0 && (
                <div className={`mt-3 pt-3 border-t space-y-2.5 ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
                  {ws.notes.map(n => (
                    <div key={n.id} className="group flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`m-0 text-[12.5px] leading-snug break-words ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{n.text}</p>
                        <p className={`m-0 mt-0.5 text-[10.5px] ${isDark ? "text-[#52525B]" : "text-slate-400"}`}>{n.author} · {n.at}</p>
                      </div>
                      <Tooltip title="Delete note">
                        <IconButton size="small" onClick={() => { removeJobNote(job.id, n.id); refresh(); }}
                          sx={{ p: 0.3, opacity: 0, transition: "opacity 0.15s", ".group:hover &": { opacity: 1 } }}>
                          <Trash size={12} color="#EF4444" weight="duotone" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Attachments" icon={Paperclip}
              action={
                <button onClick={() => fileInput.current?.click()}
                  className={`flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 rounded-lg transition-colors ${isDark ? "bg-[#27272A] text-[#D4D4D8] hover:bg-[#3F3F46]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-primary)] hover:bg-[var(--serviceops-soft)]"}`}>
                  <UploadSimple size={12} weight="bold" /> Upload File
                </button>
              }>
              <input ref={fileInput} type="file" multiple hidden
                onChange={e => { handleAttachmentFiles(e.target.files); e.target.value = ""; }} />
              {ws.attachments.length === 0 ? (
                <div className={`flex items-center justify-center py-5 text-[12.5px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No attachments</div>
              ) : (
                <div className="space-y-1.5">
                  {ws.attachments.map(a => (
                    <div key={a.id} className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${isDark ? "hover:bg-[#18181B]" : "hover:bg-[var(--serviceops-surface)]"}`}>
                      <FileText size={14} color="#EF4444" weight="duotone" className="flex-shrink-0" />
                      <span className={`flex-1 min-w-0 truncate text-[12.5px] ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{a.name}</span>
                      <span className={`text-[10.5px] flex-shrink-0 ${isDark ? "text-[#52525B]" : "text-slate-400"}`}>{a.size}</span>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => { removeJobAttachment(job.id, a.id); refresh(); }}
                          sx={{ p: 0.3, opacity: 0, transition: "opacity 0.15s", ".group:hover &": { opacity: 1 } }}>
                          <Trash size={12} color="#EF4444" weight="duotone" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

          {/* ── Row 3: sits back on the page tracks, so Alerts lines up under
                 Live Tracking and Customer Feedback fills the last two. ── */}
          {tab === "Overview" && (
            <>
              <Card title="Alerts" icon={WarningCircle}
                footer={<CardLink onClick={() => setTab("AI Insights")}>View All Alerts <CaretRightSm size={11} weight="bold" /></CardLink>}>
                {alertsPanel}
              </Card>
              <Card title="AI Recommendation" icon={Sparkle}
                footer={<CardLink onClick={() => setTab("AI Insights")}>View All Insights <CaretRightSm size={11} weight="bold" /></CardLink>}>
                {aiPanel}
              </Card>
              <div className="md:col-span-2 xl:col-span-2 min-w-0">
                <Card title="Customer Feedback" icon={Star} meta="(Last 3 Jobs)"
                  footer={<CardLink onClick={() => setTab("Feedback")}>View Feedback <CaretRightSm size={11} weight="bold" /></CardLink>}>
                  {feedbackPanel}
                </Card>
              </div>

              {/* ── Row 4: two halves of the same four tracks ── */}
              <div className="md:col-span-2 xl:col-span-2 min-w-0">
                <Card title="Activity Log" icon={ClipboardText}
                  footer={<CardLink onClick={() => setTab("Activity Log")}>View All <CaretRightSm size={11} weight="bold" /></CardLink>}>
                  {activityPanel(6)}
                </Card>
              </div>
              <div className="md:col-span-2 xl:col-span-2 min-w-0">
                <Card title="Related Jobs" icon={ClipboardText}
                  footer={<CardLink onClick={() => setTab("Related Jobs")}>View All <CaretRightSm size={11} weight="bold" /></CardLink>}>
                  {relatedPanel(3)}
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ══ Edit drawer ══ */}
      <EditJobDrawer open={editOpen} job={job} initial={toEditInput(job)}
        onClose={() => setEditOpen(false)} onSave={handleEditSave} />

      {/* ══ Quick action dialogs ══ */}
      <JobActionDialogs
        kind={dialog} job={job} onClose={() => setDialog(null)}
        onAssign={handleAssign} onStatus={handleStatus} onInvoice={handleInvoice}
        onFollowUp={handleFollowUp} onCloseJob={handleCloseJob} onAddPart={handleAddPart}
      />

      {/* ══ Full details ══ */}
      <Dialog open={fullDetailsOpen} onClose={() => setFullDetailsOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", width: "100%", maxWidth: 520, backgroundImage: "none", bgcolor: isDark ? "#0F0F0F" : "#FFFDF7", border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}` } }}>
        <DialogTitle sx={{ fontFamily: "var(--font-heading), sans-serif", fontSize: "16px", fontWeight: 700, color: isDark ? "#F4F4F5" : "#0F172A", px: 3, pt: 2.5, pb: 1 }}>
          {job.jobId} · Full Details
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <InfoRow label="Work Order" value={job.jobId} />
          <InfoRow label="Customer" value={job.customer} />
          <InfoRow label="Phone" value={detail.customerInfo.phone} />
          <InfoRow label="Email" value={detail.customerInfo.email} />
          <InfoRow label="Address" value={detail.customerInfo.address} />
          <InfoRow label="Service Type" value={job.serviceType} />
          <InfoRow label="Problem Reported" value={detail.problem} />
          {detail.description && <InfoRow label="Description" value={detail.description} />}
          <InfoRow label="Category" value={detail.category} />
          <InfoRow label="Asset" value={detail.asset} />
          <InfoRow label="Warranty" value={detail.warranty} />
          <InfoRow label="AMC Status" value={detail.amcStatus} />
          <InfoRow label="Priority" value={job.priority} />
          <InfoRow label="Status" value={job.status} />
          <InfoRow label="Technician" value={job.technician} />
          <InfoRow label="Region" value={job.region} />
          <InfoRow label="ETA" value={job.etaLabel} />
          <InfoRow label="SLA" value={`${job.slaLabel} · ${sla.label}`} />
          <InfoRow label="Expected Duration" value={`${detail.durationHrs} Hours`} />
          <InfoRow label="Created On" value={job.createdAt} />
          <InfoRow label="Total Amount" value={money(detail.total)} />
          <InfoRow label="Payment Status" value={detail.paymentStatus} />
          {detail.notes && <InfoRow label="Notes" value={detail.notes} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={() => setFullDetailsOpen(false)} sx={{ color: isDark ? "#A1A1AA" : "#64748B", textTransform: "none", fontWeight: 600, fontSize: "0.86rem" }}>Close</Button>
          <Button variant="contained" onClick={() => { setFullDetailsOpen(false); setEditOpen(true); }}
            sx={{ bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)", color: isDark ? "#F4F4F5" : "#3B1F00", borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.86rem", px: 3, "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" } }}>
            Edit Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ Photo preview ══ */}
      <Dialog open={Boolean(photoPreview)} onClose={() => setPhotoPreview(null)} maxWidth="md"
        PaperProps={{ sx: { borderRadius: "16px", backgroundImage: "none", bgcolor: isDark ? "#0F0F0F" : "#fff" } }}>
        {photoPreview && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview.src} alt={photoPreview.name} style={{ maxWidth: "100%", maxHeight: "76vh", display: "block" }} />
            <div className={`flex items-center justify-between px-4 py-2.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>
              <span className="text-[12.5px] truncate">{photoPreview.name}</span>
              <Button size="small" onClick={() => setPhotoPreview(null)}
                sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem", color: "var(--serviceops-primary)" }}>Close</Button>
            </div>
          </>
        )}
      </Dialog>

      {/* ══ Toast ══ */}
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}
          action={toast?.href ? (
            <Button size="small" onClick={() => { const href = toast.href!; setToast(null); router.push(href); }}
              sx={{ color: "#fff", textTransform: "none", fontWeight: 700, fontSize: "0.78rem" }}>
              Open <ArrowSquareOut size={12} weight="bold" style={{ marginLeft: 4 }} />
            </Button>
          ) : undefined}
          sx={{ fontWeight: 600, borderRadius: "10px", alignItems: "center" }}>
          {toast?.msg}
        </Alert>
      </Snackbar>

      {/* ══ Print sheet (screen-hidden) ══ */}
      <JobPrintSheet payload={printPayload} />
    </div>
  );
}
