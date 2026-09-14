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
import InputBase from "@mui/material/InputBase";
import {
  House, CaretRight, CaretDown, PencilSimple, DotsThreeVertical,
  Printer, Phone, MapTrifold, Star, SealCheck,
  ChatCircleDots, PhoneCall, NavigationArrow, Plus, Image as ImageIcon,
  Camera, UserSwitch, ClipboardText, FileText, CalendarPlus, XCircle,
  CheckCircle, Sparkle, Trash, UploadSimple,
  Note, Paperclip, WarningCircle, Info, CurrencyInr, Copy, ArrowSquareOut, Lightning,
  Buildings, Tag, Wrench, LinkSimple, ClockCounterClockwise, GridFour, List,
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

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

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
//  Presentational helpers (Account/Deal/Lead/Contact
//  detail-page pattern: blue SectionCard + KV grid)
// ─────────────────────────────────────────────
const AVATAR_PAL = ["#7C3AED", "#10B981", "#F59E0B", "#DB2777"];
const avatarColor = (n: string) => AVATAR_PAL[n.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PAL.length];

function SectionCard({ icon: Icon, title, children, action, id }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
  action?: React.ReactNode; id?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div id={id} className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#ffffff] border-[var(--serviceops-soft)]"}`}>
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
          <Icon size={13} color={isDark ? "#9CA3AF" : "#F59E0B"} weight="duotone" />
        </div>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] flex-1 ${isDark ? "text-[#D4D4D8]" : "text-[var(--serviceops-depth)]"}`}>{title}</p>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DotsAction() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <IconButton size="small"
      sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#E2E8F0", "&:hover": { color: "var(--serviceops-primary)", bgcolor: isDark ? "#27272A" : "var(--serviceops-tint)" }, borderRadius: "6px" }}>
      <DotsThreeVertical size={16} weight="bold" />
    </IconButton>
  );
}

function KV({ label, value, fullWidth }: { label: string; value?: string; fullWidth?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const display = value !== undefined && value !== "" ? value : undefined;
  return (
    <div className={`py-2 border-b last:border-0 ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"} ${fullWidth ? "col-span-2" : ""}`}>
      <p className={`font-heading text-[11.5px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</p>
      <p className={`text-[14px] font-medium ${!display ? (isDark ? "text-[#3F3F46] italic" : "text-slate-300 italic") : (isDark ? "text-[#D4D4D8]" : "text-slate-800")}`}>
        {display || "—"}
      </p>
    </div>
  );
}

function KVCustom({ label, fullWidth, children }: { label: string; fullWidth?: boolean; children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`py-2 border-b last:border-0 ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"} ${fullWidth ? "col-span-2" : ""}`}>
      <p className={`font-heading text-[11.5px] font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</p>
      {children}
    </div>
  );
}

function KVLink({ label, value, href }: { label: string; value: string; href: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`py-2 border-b last:border-0 ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
      <p className={`font-heading text-[11.5px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{label}</p>
      <a href={href} className={`text-[14px] font-medium hover:underline ${isDark ? "text-[#D4D4D8] hover:text-[#60A5FA]" : "text-slate-800 hover:text-[var(--serviceops-primary)]"}`}>{value}</a>
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

  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [printAnchor, setPrintAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor]   = useState<HTMLElement | null>(null);
  const [editOpen, setEditOpen]       = useState(false);
  const [dialog, setDialog]           = useState<JobDialogKind>(null);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; name: string } | null>(null);
  const [printPayload, setPrintPayload] = useState<PrintPayload | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<{ msg: string; href?: string } | null>(null);
  const [attachView, setAttachView] = useState<"list" | "grid">("list");

  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput  = useRef<HTMLInputElement>(null);

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
      <div className="sidebar-content flex-1 flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className={`text-xl font-bold mb-2 ${isDark ? "text-[#D4D4D8]" : "text-[var(--serviceops-depth)]"}`}>Job not found</p>
            <button onClick={() => router.push("/jobs")} className={`text-sm underline ${isDark ? "text-[#A1A1AA]" : "text-[var(--serviceops-depth)]"}`}>Back to Jobs</button>
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
  const avColor = avatarColor(job.customer);

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
    { label: "Assign Technician",  icon: UserSwitch,        color: "#F59E0B", onClick: () => setDialog("assign") },
    { label: "Change Status",      icon: PencilSimple,      color: "#8B5CF6", onClick: () => setDialog("status") },
    { label: "Generate Invoice",   icon: FileText,          color: "#10B981", onClick: () => setDialog("invoice") },
    { label: "Schedule Follow-up", icon: CalendarPlus,      color: "#F59E0B", onClick: () => setDialog("followUp") },
    { label: "Close Job",          icon: XCircle,           color: "#EF4444", onClick: () => setDialog("close") },
    { label: "More Actions",       icon: DotsThreeVertical, color: "#64748B", onClick: (e?: React.MouseEvent<HTMLElement>) => setMoreAnchor(e?.currentTarget ?? null) },
  ];

  const ALERT_TONE = {
    critical: { color: "#EF4444", bg: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2", icon: XCircle },
    warning:  { color: "#F59E0B", bg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", icon: WarningCircle },
    info:     { color: "#F59E0B", bg: isDark ? "rgba(29,78,216,0.14)" : "var(--serviceops-tint)", icon: Info },
  } as const;

  const relatedItems = [
    { label: "Checklist",         icon: CheckCircle, count: activeChecklist.filter(Boolean).length, color: "#10B981", target: "checklist" },
    { label: "Parts & Materials", icon: Wrench,       count: detail.parts.length,                    color: "#F59E0B", target: "parts" },
    { label: "Photos",            icon: Camera,       count: ws.photos.length,                        color: "#EC4899", target: "photos" },
    { label: "Invoice",           icon: CurrencyInr,  count: ws.invoice ? 1 : 0,                       color: "#6366F1", target: "invoice" },
    { label: "Feedback",          icon: Star,         count: 0,                                        color: "#F43F5E", target: "feedback" },
    { label: "Related Jobs",      icon: LinkSimple,   count: detail.related.length,                    color: "#64748B", target: "related-jobs" },
    { label: "Alerts",            icon: WarningCircle, count: detail.alerts.length,                    color: "#EF4444", target: "alerts" },
    { label: "Notes",             icon: Note,         count: ws.notes.length,                          color: "#8B5CF6", target: "notes" },
    { label: "Attachments",       icon: Paperclip,    count: ws.attachments.length,                    color: "#0EA5E9", target: "attachments" },
  ];

  const RelatedListPanel = ({ onClickItem }: { onClickItem: (target: string) => void }) => (
    <div className="space-y-4">
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#ffffff] border-[var(--serviceops-soft)]"}`}>
        <div className={`px-4 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
          <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>Related List</p>
        </div>
        <div className="p-2 space-y-0.5">
          {relatedItems.map(({ label, icon: Icon, count, color, target }) => (
            <button key={label} onClick={() => onClickItem(target)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl group transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[var(--serviceops-tint)]"}`}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "20" }}>
                <Icon size={14} color={color} weight="duotone" />
              </div>
              <span className={`flex-1 min-w-0 truncate text-left text-[14px] font-medium ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{label}</span>
              {count > 0 && (
                <span className="text-[12px] font-bold bg-[var(--serviceops-soft)] text-[var(--serviceops-depth)] px-1.5 py-0.5 rounded-full">{count}</span>
              )}
              <CaretRight size={14} color="#E2E8F0" weight="duotone" />
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#ffffff] border-[var(--serviceops-soft)]"}`}>
        <p className={`font-heading text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-[#ABABAD]" : "text-slate-500"}`}>Job Info</p>
        <div className="flex justify-between text-[12px]">
          <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Created</span>
          <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{job.createdAt}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Technician</span>
          <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{job.technician}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className={`font-medium ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Status</span>
          <span className="font-semibold" style={{ color: statusColor }}>{job.status}</span>
        </div>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────
  return (
    <div className="sidebar-content flex-1 flex flex-col min-h-screen">
      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 animate-fade-in">

        {/* ── Breadcrumb ── */}
        <div className={`flex items-center gap-1.5 text-[13.5px] ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>
          <House size={16} weight="duotone" />
          <CaretRight size={12} weight="duotone" />
          <Link href="/jobs" className="hover:text-[var(--serviceops-primary)] transition-colors font-medium">Jobs</Link>
          <CaretRight size={12} weight="duotone" />
          <span className="text-[var(--serviceops-depth)] font-semibold truncate max-w-[240px]">{job.jobId}</span>
        </div>

        {/* ── Header card ── */}
        <div className={`rounded-2xl border shadow-sm px-5 py-4 ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#ffffff] border-[var(--serviceops-soft)]"}`}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[1.2rem] font-extrabold flex-shrink-0"
              style={{ backgroundColor: avColor, boxShadow: "0 4px 14px 0 rgba(120,53,15,0.18)" }}>
              {job.customer.substring(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className={`text-[20px] font-extrabold tracking-tight m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{job.jobId}</h1>
              <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{job.customer} · Created {job.createdAt}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`flex items-center gap-1 text-[13px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
                  <Phone size={13} weight="duotone" color="#94A3B8" />
                  {detail.customerInfo.phone}
                </span>
                <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                  {job.status}
                </span>
                <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: isDark ? priorityMeta.bgDark : priorityMeta.bg, color: isDark ? priorityMeta.textDark : priorityMeta.text }}>
                  {job.priority} Priority
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <Button size="small" variant="outlined" endIcon={<CaretDown size={11} weight="bold" />} startIcon={<Printer size={13} weight="duotone" />}
                onClick={e => setPrintAnchor(e.currentTarget)}
                sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)", color: isDark ? "#B4B5B6" : "var(--serviceops-depth)", borderRadius: "9px", textTransform: "none", fontWeight: 600, fontSize: "0.84rem", bgcolor: isDark ? "#0F0F0F" : "transparent", "&:hover": { borderColor: "var(--serviceops-primary)", color: "var(--serviceops-primary)", bgcolor: isDark ? "#0A0A0A" : "var(--serviceops-tint)" } }}>
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

              <Button variant="contained" size="small" startIcon={<PencilSimple size={14} weight="bold" />}
                onClick={() => setEditOpen(true)}
                sx={{ bgcolor: "#F59E0B", borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.84rem", boxShadow: "0 1px 8px 0 #F59E0B33", "&:hover": { bgcolor: "#FBBF24", boxShadow: "0 2px 14px 0 #FBBF2455" }, "&:active": { bgcolor: "var(--serviceops-depth)" } }}>
                Edit Job
              </Button>

              <IconButton size="small" onClick={e => setMoreAnchor(e.currentTarget)}
                sx={{ borderRadius: "8px", border: isDark ? "1.5px solid #27272A" : "1.5px solid var(--serviceops-soft)", bgcolor: Boolean(moreAnchor) ? (isDark ? "#27272A" : "var(--serviceops-tint)") : (isDark ? "#0A0A0A" : "transparent"), "&:hover": { bgcolor: isDark ? "#27272A" : "var(--serviceops-tint)" } }}>
                <DotsThreeVertical size={16} color={isDark ? "#A1A1AA" : "#475569"} weight="bold" />
              </IconButton>
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
        </div>

        {/* ── Tab bar ── */}
        <div className={`flex items-center gap-1 border rounded-xl p-1 w-fit shadow-sm ${isDark ? "bg-[#000000] border-[#27272A]" : "bg-[#ffffff] border-[var(--serviceops-soft)]"}`}>
          {(["overview", "timeline"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[14px] font-semibold capitalize transition-all ${
                activeTab === t
                  ? "bg-[var(--serviceops-primary)] text-white shadow-sm"
                  : isDark ? "text-[#B4B5B6] bg-[#0A0A0A] hover:bg-[#27272A] hover:text-[#D4D4D8]"
                  : "text-[var(--serviceops-depth)] bg-[var(--serviceops-soft)] hover:bg-[#F59E0B]/10"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 space-y-5 min-w-0">

              {/* ── Job Information ── */}
              <SectionCard icon={ClipboardText} title="Job Information" action={<DotsAction />}>
                <div className="grid grid-cols-2 gap-x-10 gap-y-0">
                  <KV label="Work Order" value={job.jobId} />
                  <KV label="Service Type" value={job.serviceType} />
                  <KV label="Category" value={detail.category} />
                  <KVCustom label="Priority">
                    <span className="inline-flex items-center text-[12.5px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: isDark ? priorityMeta.bgDark : priorityMeta.bg, color: isDark ? priorityMeta.textDark : priorityMeta.text }}>{job.priority}</span>
                  </KVCustom>
                  <KVCustom label="Status">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                      <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />{job.status}
                    </span>
                  </KVCustom>
                  <KVCustom label="SLA">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-16 rounded-full overflow-hidden ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
                        <div className="h-full rounded-full" style={{ width: `${sla.pct}%`, backgroundColor: sla.tone === "critical" ? "#EF4444" : sla.tone === "good" ? "#10B981" : "#F59E0B" }} />
                      </div>
                      <span className={`text-[13px] font-semibold whitespace-nowrap ${sla.tone === "critical" ? "text-red-500" : isDark ? "text-[#D4D4D8]" : "text-slate-800"}`}>{sla.label}</span>
                    </div>
                  </KVCustom>
                  <KV label="Technician" value={job.technician} />
                  <KV label="ETA" value={job.etaLabel} />
                  <KV label="Expected Duration" value={`${detail.durationHrs} Hours`} />
                  <KV label="Asset" value={detail.asset} />
                  <KV label="Warranty" value={detail.warranty} />
                  <KV label="AMC Status" value={detail.amcStatus} />
                  <KV label="Region" value={job.region} />
                  <KV label="Created On" value={job.createdAt} />
                </div>
              </SectionCard>

              {/* ── Quick Actions ── */}
              <SectionCard icon={Lightning} title="Quick Actions">
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_ACTIONS.map(({ label, icon: Icon, color, onClick }) => (
                    <button key={label} onClick={e => onClick(e)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-center transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[var(--serviceops-tint)]"}`}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "1F" }}>
                        <Icon size={16} color={color} weight="duotone" />
                      </div>
                      <span className={`text-[11px] font-medium leading-tight ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* ── Customer Information ── */}
              <div id="section-customer">
                <SectionCard icon={Buildings} title="Customer Information"
                  action={
                    <div className="flex items-center gap-2">
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(detail.customerInfo.address)}`} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1 text-[12.5px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${isDark ? "bg-[#27272A] text-[#D4D4D8] hover:bg-[#3F3F46]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-soft)]"}`}>
                        <MapTrifold size={13} weight="duotone" /> View on Map
                      </a>
                      <DotsAction />
                    </div>
                  }>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-0">
                    <KV label="Customer Name" value={job.customer} fullWidth />
                    <KVLink label="Phone" value={detail.customerInfo.phone} href={`tel:${detail.customerInfo.phone.replace(/\s/g, "")}`} />
                    <KVLink label="Email" value={detail.customerInfo.email} href={`mailto:${detail.customerInfo.email}`} />
                    <KV label="Address" value={detail.customerInfo.address} fullWidth />
                  </div>
                </SectionCard>
              </div>

              {/* ── Assigned Technician ── */}
              <div id="section-technician">
                <SectionCard icon={UserSwitch} title="Assigned Technician">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={TECHNICIAN_AVATARS[job.technician]} sx={{ width: 44, height: 44 }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className={`text-[14.5px] font-bold m-0 truncate ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{job.technician}</p>
                        <SealCheck size={14} color="#F59E0B" weight="fill" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {starRating(techRating.rating, 11)}
                        <span className={`text-[11.5px] ml-1 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{techRating.rating} · ({techRating.jobs} Jobs)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] mb-3">
                    <Phone size={13} color="#94A3B8" weight="duotone" />
                    <a href={`tel:${TECHNICIAN_PHONES[job.technician].replace(/\s/g, "")}`} className={`hover:underline ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{TECHNICIAN_PHONES[job.technician]}</a>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                      <span className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: statusColor }} />{TECH_STATUS_LABEL[job.status]}
                    </span>
                    <span className={`text-[12px] font-medium ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>ETA {job.etaLabel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(detail.customerInfo.address)}`} target="_blank" rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#27272A] text-[#D4D4D8] hover:bg-[#3F3F46]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-soft)]"}`}>
                      <NavigationArrow size={15} weight="duotone" />Directions
                    </a>
                    <a href={`tel:${TECHNICIAN_PHONES[job.technician].replace(/\s/g, "")}`}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#27272A] text-[#D4D4D8] hover:bg-[#3F3F46]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-soft)]"}`}>
                      <PhoneCall size={15} weight="duotone" />Call
                    </a>
                    <Link href="/comms"
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10.5px] font-semibold transition-colors ${isDark ? "bg-[#27272A] text-[#D4D4D8] hover:bg-[#3F3F46]" : "bg-[var(--serviceops-tint)] text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-soft)]"}`}>
                      <ChatCircleDots size={15} weight="duotone" />Chat
                    </Link>
                  </div>
                </SectionCard>
              </div>

              {/* ── Description ── */}
              <SectionCard icon={Tag} title="Description">
                <KV label="Problem Reported" value={detail.problem} fullWidth />
                <KV label="Description" value={detail.description} fullWidth />
                <KV label="Notes" value={detail.notes} fullWidth />
              </SectionCard>

              {/* ── Checklist ── */}
              <div id="section-checklist">
                <SectionCard icon={CheckCircle} title="Checklist" action={<DotsAction />}>
                  <div className="space-y-0.5 -mx-1">
                    {CHECKLIST_ITEMS.map((item, i) => (
                      <label key={item} className={`flex items-center gap-1.5 px-1 py-1 rounded-lg cursor-pointer transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[var(--serviceops-tint)]"}`}>
                        <Checkbox size="small" checked={!!activeChecklist[i]} onChange={() => toggleChecklist(i)}
                          sx={{ p: 0.5, color: isDark ? "#3F3F46" : "#CBD5E1", "&.Mui-checked": { color: "#10B981" } }} />
                        <span className={`text-[14px] ${activeChecklist[i] ? (isDark ? "text-[#71717A] line-through" : "text-slate-400 line-through") : (isDark ? "text-[#D4D4D8]" : "text-slate-700")}`}>{item}</span>
                      </label>
                    ))}
                  </div>
                </SectionCard>
              </div>

              {/* ── Parts & Materials ── */}
              <div id="section-parts">
                <SectionCard icon={Wrench} title="Parts & Materials"
                  action={
                    <div className="flex items-center gap-2">
                      <Button size="small" variant="contained" startIcon={<Plus size={13} weight="bold" />} onClick={() => setDialog("addPart")}
                        sx={{ bgcolor: isDark ? "#27272A" : "#F59E0B", color: isDark ? "#F4F4F5" : "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.73rem", boxShadow: isDark ? "none" : "0 1px 6px #F59E0B33", "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" } }}>
                        Add Item
                      </Button>
                      <DotsAction />
                    </div>
                  }>
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-[13px] border-collapse">
                      <thead>
                        <tr className={`border-b ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}>
                          <th className={`text-left py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-[var(--serviceops-depth)]"}`}>Item</th>
                          <th className={`text-right py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-[var(--serviceops-depth)]"}`}>Qty</th>
                          <th className={`text-right py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-[var(--serviceops-depth)]"}`}>Rate (₹)</th>
                          <th className={`text-right py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-[var(--serviceops-depth)]"}`}>Amount (₹)</th>
                          <th className="w-6" />
                        </tr>
                      </thead>
                      <tbody>
                        {detail.parts.map((p, i) => {
                          const isExtra = i >= detail.templatePartCount;
                          return (
                            <tr key={`${p.item}-${i}`} className={`border-b group transition-colors ${isDark ? "border-[#27272A] hover:bg-[#27272A]" : "border-[var(--serviceops-tint)] hover:bg-[rgba(245,158,11,0.05)]"}`}>
                              <td className={`py-2.5 pr-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-700"}`}>{p.item}</td>
                              <td className={`py-2.5 pr-4 text-right ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{p.qty}</td>
                              <td className={`py-2.5 pr-4 text-right ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{p.rate.toLocaleString("en-IN")}</td>
                              <td className={`py-2.5 pr-4 text-right font-semibold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{(p.qty * p.rate).toLocaleString("en-IN")}</td>
                              <td className="py-2.5 text-right">
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
                        <tr className={`border-t ${isDark ? "border-[#3F3F46]" : "border-[var(--serviceops-soft)]"}`}>
                          <td colSpan={3} className={`py-2.5 text-right text-[12px] font-semibold ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>Parts Total</td>
                          <td className={`py-2.5 pr-4 text-right font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{detail.partsTotal.toLocaleString("en-IN")}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

              {/* ── Photos ── */}
              <div id="section-photos">
                <SectionCard icon={Camera} title="Photos"
                  action={
                    <>
                      <input ref={photoInput} type="file" accept="image/*" multiple hidden
                        onChange={e => { handlePhotoFiles(e.target.files); e.target.value = ""; }} />
                      <Button size="small" variant="outlined" startIcon={<UploadSimple size={13} weight="bold" />} onClick={() => photoInput.current?.click()}
                        sx={{ borderColor: isDark ? "#3F3F46" : "var(--serviceops-soft)", color: isDark ? "#A1A1AA" : "var(--serviceops-depth)", bgcolor: isDark ? "#27272A" : "var(--serviceops-soft)", borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: "0.73rem", "&:hover": { borderColor: isDark ? "#9CA3AF" : "var(--serviceops-soft)", bgcolor: isDark ? "#3F3F46" : "#ffffff" } }}>
                        Add Photos
                      </Button>
                    </>
                  }>
                  {ws.photos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {ws.photos.map(photo => (
                        <div key={photo.id} className="relative group">
                          <button onClick={() => photo.src && setPhotoPreview({ src: photo.src, name: photo.name })}
                            className={`w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"} ${photo.src ? "cursor-zoom-in" : "cursor-default"}`}>
                            {photo.src
                              // Data-URL thumbnails from the file picker — next/image can't optimise these.
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={photo.src} alt={photo.name} className="w-full h-full object-cover" />
                              : <ImageIcon size={20} color={isDark ? "#3F3F46" : "#94A3B8"} weight="duotone" />}
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
                    <div className={`flex flex-col items-center justify-center py-8 gap-1 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>
                      <Camera size={26} weight="duotone" />
                      No photos yet
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* ── Invoice ── */}
              <div id="section-invoice">
                <SectionCard icon={CurrencyInr} title="Invoice"
                  action={
                    <div className="flex items-center gap-2">
                      {!ws.invoice && (
                        <Button size="small" variant="contained" startIcon={<FileText size={13} weight="bold" />} onClick={() => setDialog("invoice")}
                          sx={{ bgcolor: isDark ? "#27272A" : "#F59E0B", color: isDark ? "#F4F4F5" : "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.73rem", boxShadow: isDark ? "none" : "0 1px 6px #F59E0B33", "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" } }}>
                          Generate Invoice
                        </Button>
                      )}
                      <DotsAction />
                    </div>
                  }>
                  <div className="space-y-1.5">
                    {ws.invoice && (
                      <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-3 ${isDark ? "bg-[rgba(29,78,216,0.14)]" : "bg-[var(--serviceops-tint)]"}`}>
                        <div>
                          <p className={`m-0 text-[14px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{ws.invoice.number}</p>
                          <p className={`m-0 text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Generated {ws.invoice.generatedAt}</p>
                        </div>
                        <Button size="small" startIcon={<Printer size={13} weight="duotone" />} onClick={() => handlePrint("invoice")}
                          sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.76rem", color: "var(--serviceops-depth)", borderRadius: "8px" }}>
                          Print
                        </Button>
                      </div>
                    )}
                    {([["Labour Charges", detail.labor], ["Parts & Materials", detail.partsTotal], ["Tax (18%)", detail.tax], ["Discount", -detail.discount]] as [string, number][]).map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between text-[14px]">
                        <span className={isDark ? "text-[#A1A1AA]" : "text-slate-500"}>{label}</span>
                        <span className={isDark ? "text-[#D4D4D8]" : "text-slate-700"}>{val < 0 ? "-" : ""}{money(Math.abs(val))}</span>
                      </div>
                    ))}
                    <div className={`flex items-center justify-between pt-2 mt-1 border-t ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}>
                      <span className={`text-[15px] font-bold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>Total Amount</span>
                      <span className={`text-[17px] font-extrabold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{money(detail.total)}</span>
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
                </SectionCard>
              </div>

              {/* ── Customer Feedback ── */}
              <div id="section-feedback">
                <SectionCard icon={Star} title="Customer Feedback">
                  <div className="grid grid-cols-2 gap-x-10">
                    <div>
                      <p className={`text-[11.5px] font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>Overall Rating</p>
                      {starRating(detail.feedbackRating, 18)}
                      <p className={`text-[16px] font-bold mt-2 m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{detail.feedbackRating}/5</p>
                    </div>
                    <div>
                      <p className={`text-[11.5px] font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>NPS Score</p>
                      <p className={`text-[22px] font-extrabold m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{detail.nps}</p>
                      <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>{detail.npsBand}</p>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* ── Related Jobs ── */}
              <div id="section-related-jobs">
                <SectionCard icon={LinkSimple} title="Related Jobs" action={<DotsAction />}>
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-[14px] min-w-[560px]">
                      <thead>
                        <tr className={`border-b ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-soft)]"}`}>
                          {["Job ID", "Service Type", "Customer", "Status", "ETA"].map(h => (
                            <th key={h} className={`text-left py-2 pr-4 text-[11.5px] font-bold uppercase tracking-wider whitespace-nowrap ${isDark ? "text-[#71717A]" : "text-[var(--serviceops-depth)]"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.related.length === 0 ? (
                          <tr><td colSpan={5} className={`py-8 text-center text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No rows</td></tr>
                        ) : detail.related.map(r => {
                          const meta = STATUS_META[r.status as JobStatus];
                          return (
                            <tr key={r.jobId} onClick={() => router.push(`/jobs/${r.id}`)}
                              className={`border-b cursor-pointer transition-colors ${isDark ? "border-[#27272A] hover:bg-[#27272A]" : "border-[var(--serviceops-tint)] hover:bg-[rgba(245,158,11,0.05)]"}`}>
                              <td className={`py-3 pr-4 font-medium hover:underline ${isDark ? "text-[#A1A1AA]" : "text-[var(--serviceops-depth)]"}`}>{r.jobId}</td>
                              <td className={`py-3 pr-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{r.label}</td>
                              <td className={`py-3 pr-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{r.customer}</td>
                              <td className="py-3 pr-4">
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: isDark ? meta.bgDark : meta.bgLight, color: isDark ? meta.dark : meta.light }}>{r.status}</span>
                              </td>
                              <td className={`py-3 pr-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>{r.eta}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

              {/* ── Alerts ── */}
              <div id="section-alerts">
                <SectionCard icon={WarningCircle} title="Alerts">
                  {detail.alerts.length === 0 ? (
                    <div className={`flex items-center justify-center py-6 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No alerts</div>
                  ) : (
                    <div className="space-y-2">
                      {detail.alerts.map((a, i) => {
                        const tone = ALERT_TONE[a.tone];
                        const Icon = tone.icon;
                        return (
                          <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: tone.bg }}>
                            <Icon size={14} color={tone.color} weight="fill" className="mt-[1px] flex-shrink-0" />
                            <span className={`text-[13px] leading-snug ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{a.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* ── AI Recommendation ── */}
              <SectionCard icon={Sparkle} title="AI Recommendation">
                <div className="space-y-2.5">
                  {detail.recs.map((r, i) => {
                    const color = r.tone === "critical" ? "#EF4444" : r.tone === "warning" ? "#F59E0B" : "#10B981";
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className={`text-[14px] leading-snug ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{r.text}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* ── Job Notes ── */}
              <div id="section-notes">
                <SectionCard icon={Note} title="Job Notes">
                  <div className="space-y-3">
                    <div className={`border rounded-xl overflow-hidden transition-all ${isDark ? "border-[#3F3F46] focus-within:border-[#9CA3AF]" : "border-[var(--serviceops-soft)] focus-within:border-[var(--serviceops-primary)] focus-within:shadow-[0_0_0_2px_var(--serviceops-soft)]"}`}>
                      <InputBase fullWidth multiline minRows={2} placeholder="Add internal note…"
                        value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote(); }}
                        sx={{ px: 2, py: 1.5, fontSize: "0.8rem", color: isDark ? "#D4D4D8" : "#334155", "& textarea::placeholder": { color: isDark ? "#3F3F46" : "#94A3B8", opacity: 1 } }} />
                      {noteDraft.trim() && (
                        <div className="flex justify-end px-3 pb-2">
                          <Button size="small" variant="contained" onClick={submitNote}
                            sx={{ bgcolor: isDark ? "#27272A" : "#F59E0B", color: isDark ? "#F4F4F5" : "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.73rem", "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" } }}>
                            Add Note
                          </Button>
                        </div>
                      )}
                    </div>
                    {ws.notes.map(n => (
                      <div key={n.id} className={`group flex items-start gap-2 rounded-xl px-4 py-3 border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[14px] m-0 leading-snug break-words ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{n.text}</p>
                          <p className={`text-[12px] mt-1 m-0 ${isDark ? "text-[#ABABAD]" : "text-slate-400"}`}>{n.author} · {n.at}</p>
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
                </SectionCard>
              </div>

              {/* ── Attachments ── */}
              <div id="section-attachments">
                <SectionCard icon={Paperclip} title="Attachments"
                  action={
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center rounded-lg p-0.5 gap-0.5 ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
                        {[{ k: "list", Icon: List }, { k: "grid", Icon: GridFour }].map(({ k, Icon }) => (
                          <button key={k} onClick={() => setAttachView(k as "list" | "grid")}
                            className={`p-1 rounded-md transition-colors ${attachView === k ? (isDark ? "bg-[#3F3F46] text-[#D4D4D8]" : "bg-[#ffffff] text-[var(--serviceops-primary)]") : (isDark ? "text-[#9CA3AF]" : "text-slate-400")}`}>
                            <Icon size={13} weight="duotone" />
                          </button>
                        ))}
                      </div>
                      <input ref={fileInput} type="file" multiple hidden
                        onChange={e => { handleAttachmentFiles(e.target.files); e.target.value = ""; }} />
                      <Button size="small" variant="outlined" startIcon={<UploadSimple size={13} weight="bold" />} onClick={() => fileInput.current?.click()}
                        sx={{ borderColor: isDark ? "#3F3F46" : "var(--serviceops-soft)", color: isDark ? "#A1A1AA" : "var(--serviceops-depth)", bgcolor: isDark ? "#27272A" : "var(--serviceops-soft)", borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: "0.73rem", "&:hover": { borderColor: isDark ? "#9CA3AF" : "var(--serviceops-soft)", bgcolor: isDark ? "#3F3F46" : "#ffffff" } }}>
                        Attach
                      </Button>
                    </div>
                  }>
                  {ws.attachments.length === 0 ? (
                    <div className={`flex items-center justify-center py-6 text-[14px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>No attachments yet</div>
                  ) : attachView === "list" ? (
                    <div className="space-y-1.5">
                      {ws.attachments.map(a => (
                        <div key={a.id} className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[var(--serviceops-tint)]"}`}>
                          <FileText size={14} color="#EF4444" weight="duotone" className="flex-shrink-0" />
                          <span className={`flex-1 min-w-0 truncate text-[14px] ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{a.name}</span>
                          <span className={`text-[11px] flex-shrink-0 ${isDark ? "text-[#52525B]" : "text-slate-400"}`}>{a.size}</span>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => { removeJobAttachment(job.id, a.id); refresh(); }}
                              sx={{ p: 0.3, opacity: 0, transition: "opacity 0.15s", ".group:hover &": { opacity: 1 } }}>
                              <Trash size={12} color="#EF4444" weight="duotone" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {ws.attachments.map(a => (
                        <div key={a.id} className={`group relative flex flex-col items-center justify-center gap-1.5 aspect-square rounded-lg border px-2 text-center ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
                          <FileText size={22} color="#EF4444" weight="duotone" />
                          <span className={`text-[11px] truncate w-full ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{a.name}</span>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => { removeJobAttachment(job.id, a.id); refresh(); }}
                              sx={{ position: "absolute", top: 4, right: 4, p: 0.3, opacity: 0, transition: "opacity 0.15s", ".group:hover &": { opacity: 1 } }}>
                              <Trash size={11} color="#EF4444" weight="bold" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>

            </div>{/* end col-span-2 */}

            <div className="lg:sticky lg:top-4 lg:self-start">
              <RelatedListPanel onClickItem={target =>
                document.getElementById(`section-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
              } />
            </div>
          </div>
        )}

        {/* ══════════════ TIMELINE TAB ══════════════ */}
        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? "bg-[#1C1C1E] border-[#27272A]" : "bg-[#ffffff] border-[var(--serviceops-soft)]"}`}>
                <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${isDark ? "border-[#27272A]" : "border-[var(--serviceops-tint)]"}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-tint)]"}`}>
                    <ClockCounterClockwise size={13} color={isDark ? "#9CA3AF" : "#F59E0B"} weight="duotone" />
                  </div>
                  <p className={`font-heading text-[12px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-[#D4D4D8]" : "text-[var(--serviceops-depth)]"}`}>
                    Job Timeline <span className="normal-case font-medium opacity-70">(Current Status: {job.status})</span>
                  </p>
                </div>

                {detail.activity.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <ClockCounterClockwise size={28} color={isDark ? "#27272A" : "#E2E8F0"} weight="duotone" />
                    <p className={`text-[14px] ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>No history yet</p>
                  </div>
                ) : (
                  <div className="px-6 py-5">
                    {[...detail.activity].reverse().map((entry, i, arr) => {
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} className="flex gap-4">
                          <div className="w-20 flex-shrink-0 text-right pt-1.5">
                            <span className={`text-[12px] font-medium ${isDark ? "text-[#9CA3AF]" : "text-slate-400"}`}>{entry.at}</span>
                          </div>
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0 ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
                              <CheckCircle size={13} color={isDark ? "#9CA3AF" : "#F59E0B"} weight="duotone" />
                            </div>
                            {!isLast && <div className={`w-px flex-1 my-1 min-h-[20px] ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-soft)]"}`} />}
                          </div>
                          <div className="pb-5 flex-1 min-w-0 overflow-hidden">
                            <p className={`text-[14px] leading-relaxed break-words ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>{entry.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>{/* end col-span-2 */}

            <div className="lg:sticky lg:top-4 lg:self-start">
              <RelatedListPanel onClickItem={() => setActiveTab("overview")} />
            </div>
          </div>
        )}
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
                sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem", color: "var(--serviceops-depth)" }}>Close</Button>
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
