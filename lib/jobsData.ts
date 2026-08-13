/**
 * Shared Jobs (Field Service work orders) demo dataset.
 * Consumed by the Jobs list page and the Job Details page so both
 * views stay in sync when navigating from a row to its detail screen.
 */

export type JobStatus =
  | "Scheduled" | "Assigned" | "On Route" | "In Progress" | "On Hold" | "Completed" | "Cancelled";

export type JobPriority = "High" | "Medium" | "Low";

export type ServiceType =
  | "AC Repair" | "Generator Service" | "HVAC Maintenance"
  | "Electrical Repair" | "Plumbing" | "Other Services";

export interface JobRecord {
  id: number;
  jobId: string;
  customer: string;
  serviceType: ServiceType;
  technician: string;
  priority: JobPriority;
  status: JobStatus;
  etaLabel: string;
  slaLabel: string;
  slaHours: number;
  slaBreached: boolean;
  region: string;
  createdAt: string;
}

// ── Fixed-order categorical palette (validated adjacent-pair CVD separation —
//    see dataviz skill). Never reassigned when the visible status/service-type
//    set changes (e.g. filtering) — only ever indexed by this static order. ──
export const STATUS_ORDER: JobStatus[] = ["Scheduled", "Assigned", "On Route", "In Progress", "On Hold", "Completed", "Cancelled"];
const STATUS_HUES_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7"];
const STATUS_HUES_DARK  = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c", "#9085e9"];

export const SERVICE_TYPE_ORDER: ServiceType[] = ["AC Repair", "Generator Service", "HVAC Maintenance", "Electrical Repair", "Plumbing", "Other Services"];
const SERVICE_HUES_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const SERVICE_HUES_DARK  = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c"];

export interface StatusMeta { light: string; dark: string; bgLight: string; bgDark: string; }
export const STATUS_META: Record<JobStatus, StatusMeta> = Object.fromEntries(
  STATUS_ORDER.map((s, i) => [s, {
    light: STATUS_HUES_LIGHT[i],
    dark: STATUS_HUES_DARK[i],
    bgLight: STATUS_HUES_LIGHT[i] + "1A",
    bgDark: STATUS_HUES_DARK[i] + "29",
  }])
) as Record<JobStatus, StatusMeta>;

export const SERVICE_TYPE_META: Record<ServiceType, { light: string; dark: string }> = Object.fromEntries(
  SERVICE_TYPE_ORDER.map((s, i) => [s, { light: SERVICE_HUES_LIGHT[i], dark: SERVICE_HUES_DARK[i] }])
) as Record<ServiceType, { light: string; dark: string }>;

// Priority reuses the same red/amber/green ordinal pattern already
// established elsewhere in the app (Tasks, Accounts priority pills).
export const PRIORITY_META: Record<JobPriority, { bg: string; text: string; bgDark: string; textDark: string }> = {
  High:   { bg: "#FEF2F2", text: "#DC2626", bgDark: "rgba(239,68,68,0.16)",  textDark: "#F87171" },
  Medium: { bg: "#FEF3C7", text: "#D97706", bgDark: "rgba(245,158,11,0.16)", textDark: "#FBBF24" },
  Low:    { bg: "#F0FDF4", text: "#16A34A", bgDark: "rgba(16,185,129,0.16)", textDark: "#34D399" },
};

export const SLA_HOURS_BY_SERVICE: Record<ServiceType, number> = {
  "AC Repair": 2, "Generator Service": 3, "HVAC Maintenance": 4,
  "Electrical Repair": 2, "Plumbing": 2, "Other Services": 3,
};

export const TECHNICIANS = ["Arun Kumar", "Rahul Nair", "John Smith", "Sneha P.", "Vikram S."] as const;

export const TECHNICIAN_AVATARS: Record<string, string> = {
  "Arun Kumar": "https://randomuser.me/api/portraits/men/52.jpg",
  "Rahul Nair": "https://randomuser.me/api/portraits/men/29.jpg",
  "John Smith": "https://randomuser.me/api/portraits/men/71.jpg",
  "Sneha P.":   "https://randomuser.me/api/portraits/women/47.jpg",
  "Vikram S.":  "https://randomuser.me/api/portraits/men/61.jpg",
};

export const TECHNICIAN_PHONES: Record<string, string> = {
  "Arun Kumar": "+91 98765 43210",
  "Rahul Nair": "+91 91234 56780",
  "John Smith": "+91 90000 11223",
  "Sneha P.":   "+91 98111 22334",
  "Vikram S.":  "+91 97222 33445",
};

export const TECHNICIAN_RATINGS: Record<string, { rating: number; jobs: number }> = {
  "Arun Kumar": { rating: 4.8, jobs: 128 },
  "Rahul Nair": { rating: 4.6, jobs: 96 },
  "John Smith": { rating: 4.9, jobs: 214 },
  "Sneha P.":   { rating: 4.7, jobs: 152 },
  "Vikram S.":  { rating: 4.5, jobs: 83 },
};

const CUSTOMERS = [
  "Reliance Mall", "ABC Hospital", "Hotel Green", "Tech Park", "City Center",
  "Global Towers", "Sunrise Hotel", "PVR Cinemas", "Lulu Mall", "Infosys",
  "Metro Plaza", "Silver Oaks Residency", "Cyber Towers", "Grand Central Mall",
  "Horizon Corporate Park", "Palm Grove Resort", "Sunshine Apartments",
  "Orion Business Bay", "Riverside Clinic", "Meridian School",
];

export const CUSTOMER_DIRECTORY: Record<string, { phone: string; email: string; address: string }> = {
  "Reliance Mall": { phone: "+91 98765 43210", email: "facility@reliancemall.com", address: "Reliance Mall, 3rd Floor, New Link Road, Andheri West, Mumbai - 400053" },
  "ABC Hospital":  { phone: "+91 98220 11009", email: "facilities@abchospital.in", address: "ABC Hospital, Sector 12, Sanjay Nagar, Bengaluru - 560094" },
  "Hotel Green":   { phone: "+91 99870 44556", email: "engg@hotelgreen.com", address: "Hotel Green, MG Road, Pune - 411001" },
};

export const REGIONS = ["North", "South", "East", "West", "Central"];

// Selectable equipment per service type — powers the Product Model field on
// the Create Job form and the Asset row on the Job Details screen.
export const PRODUCT_MODELS: Record<ServiceType, string[]> = {
  "AC Repair":         ["LG 2 Ton Split AC", "Daikin 1.5 Ton Inverter", "Voltas 1 Ton Window AC", "Blue Star Cassette AC"],
  "Generator Service": ["Kirloskar 62.5 kVA", "Cummins 100 kVA", "Mahindra 25 kVA", "Ashok Leyland 40 kVA"],
  "HVAC Maintenance":  ["Carrier AHU 5000", "Trane RTAC Chiller", "Daikin VRV IV", "Hitachi Ducted Unit"],
  "Electrical Repair": ["Schneider Acti9 DB", "L&T Distribution Panel", "Siemens Sentron MCCB", "ABB Circuit Breaker"],
  "Plumbing":          ["Jaquar Pressure Pump", "Kirloskar Water Pump", "Ashirvad CPVC Line", "Grundfos Booster Set"],
  "Other Services":    ["Generic Facility Unit", "Custom Equipment"],
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const idx = (i: number, len: number) => ((i % len) + len) % len;
const pad = (n: number) => String(n).length === 1 ? `0${n}` : `${n}`;

function stamp(d: Date, withYear = true): string {
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const date = `${MONTH_NAMES[d.getMonth()]} ${pad(d.getDate())}${withYear ? `, ${d.getFullYear()}` : ","}`;
  return `${date} ${pad(hours12)}:${pad(d.getMinutes())} ${ampm}`;
}

function formatDate(offsetHours: number): string {
  const base = new Date(2026, 4, 26, 9, 30); // 26 May 2026, 09:30
  return stamp(new Date(base.getTime() - offsetHours * 3600 * 1000));
}

function etaFor(status: JobStatus, i: number): string {
  switch (status) {
    case "Completed": return formatDate(i % 60);
    case "Cancelled":  return "—";
    case "Scheduled":
    case "Assigned":   return formatDate(-(6 + (i % 5) * 6));
    default:           return `${10 + (i % 8) * 10} mins`;
  }
}

// First ten rows are transcribed verbatim from the reference screenshot so the
// primary showcase record (WO-1024) matches the Job Details reference exactly.
const SEED_ROWS: Omit<JobRecord, "slaLabel" | "slaHours" | "slaBreached" | "createdAt">[] = [
  { id: 1,  jobId: "WO-1024", customer: "Reliance Mall",   serviceType: "AC Repair",          technician: "Arun Kumar", priority: "High",   status: "On Route",    etaLabel: "20 mins",       region: "West"    },
  { id: 2,  jobId: "WO-1025", customer: "ABC Hospital",    serviceType: "Generator Service",  technician: "Rahul Nair", priority: "Medium", status: "In Progress", etaLabel: "1 hr",          region: "South"   },
  { id: 3,  jobId: "WO-1026", customer: "Hotel Green",     serviceType: "HVAC Maintenance",   technician: "John Smith", priority: "Low",    status: "Scheduled",   etaLabel: "May 27, 10 AM", region: "Central" },
  { id: 4,  jobId: "WO-1027", customer: "Tech Park",       serviceType: "Electrical Repair",  technician: "Sneha P.",   priority: "High",   status: "Assigned",    etaLabel: "May 26, 2 PM",  region: "North"   },
  { id: 5,  jobId: "WO-1028", customer: "City Center",     serviceType: "Plumbing",           technician: "Vikram S.",  priority: "Medium", status: "In Progress", etaLabel: "45 mins",       region: "East"    },
  { id: 6,  jobId: "WO-1029", customer: "Global Towers",   serviceType: "AC Repair",          technician: "Arun Kumar", priority: "Medium", status: "On Hold",     etaLabel: "—",             region: "West"    },
  { id: 7,  jobId: "WO-1030", customer: "Sunrise Hotel",   serviceType: "Generator Service",  technician: "Rahul Nair", priority: "High",   status: "In Progress", etaLabel: "30 mins",       region: "South"   },
  { id: 8,  jobId: "WO-1031", customer: "PVR Cinemas",     serviceType: "HVAC Maintenance",   technician: "John Smith", priority: "Low",    status: "Completed",   etaLabel: "May 24, 4 PM",  region: "Central" },
  { id: 9,  jobId: "WO-1032", customer: "Lulu Mall",       serviceType: "Electrical Repair",  technician: "Sneha P.",   priority: "Medium", status: "Completed",   etaLabel: "May 24, 1 PM",  region: "North"   },
  { id: 10, jobId: "WO-1033", customer: "Infosys",         serviceType: "AC Repair",          technician: "Vikram S.",  priority: "Low",    status: "Cancelled",   etaLabel: "—",             region: "East"    },
];

const EXTRA_ROWS = 58;

function buildJobs(): JobRecord[] {
  const rows: JobRecord[] = SEED_ROWS.map((r, i) => ({
    ...r,
    slaHours: SLA_HOURS_BY_SERVICE[r.serviceType],
    slaLabel: r.status === "Cancelled" ? "SLA: —" : `SLA: ${SLA_HOURS_BY_SERVICE[r.serviceType]} hrs`,
    slaBreached: r.status === "On Hold",
    createdAt: formatDate(i * 3 + 2),
  }));

  for (let i = 0; i < EXTRA_ROWS; i++) {
    const id = SEED_ROWS.length + i + 1;
    const customer = CUSTOMERS[idx(i * 7 + 3, CUSTOMERS.length)];
    const serviceType = SERVICE_TYPE_ORDER[idx(i, SERVICE_TYPE_ORDER.length)];
    const technician = TECHNICIANS[idx(i * 2 + 1, TECHNICIANS.length)];
    const priority = (["High", "Medium", "Low"] as const)[idx(i * 5, 3)];
    const status = STATUS_ORDER[idx(i * 3 + 2, STATUS_ORDER.length)];
    const region = REGIONS[idx(i, REGIONS.length)];
    const slaHours = SLA_HOURS_BY_SERVICE[serviceType];
    const slaBreached = idx(i, 17) === 5 && status !== "Completed" && status !== "Cancelled";
    rows.push({
      id, jobId: `WO-${1034 + i}`, customer, serviceType, technician, priority, status,
      etaLabel: etaFor(status, i),
      slaLabel: status === "Cancelled" ? "SLA: —" : `SLA: ${slaHours} hrs`,
      slaHours, slaBreached, region,
      createdAt: formatDate(48 + i * 5),
    });
  }
  return rows;
}

export const ALL_JOBS: JobRecord[] = buildJobs();

export const getJobById = (id: number): JobRecord | undefined => ALL_JOBS.find(j => j.id === id);

// ─────────────────────────────────────────────
//  Job creation
//  There's no backend in this build, so a created
//  job is unshifted into ALL_JOBS — that keeps the
//  listing and the details screen (getJobById,
//  Related Jobs) resolving it for the whole session.
// ─────────────────────────────────────────────

/** Free-text detail captured on the Create Job form but not part of the list row. */
export interface JobExtras {
  jobTitle: string;
  description: string;
  scheduleStart: string;
  scheduleEnd: string;
  productModel: string;
  serialNumber: string;
  notes: string;
}

export const JOB_EXTRAS: Record<number, JobExtras> = {};

export interface NewJobInput {
  customer: string;
  address: string;
  email: string;
  city: string;
  phone: string;
  state: string;
  pincode: string;
  region: string;
  serviceType: ServiceType;
  priority: JobPriority;
  status: JobStatus;
  jobTitle: string;
  description: string;
  scheduleStart: string; // datetime-local value
  scheduleEnd: string;   // datetime-local value
  technician: string;
  productModel: string;
  serialNumber: string;
  notes: string;
}

/** "2026-08-14T10:00" → "Aug 14, 10:00 AM" — matches the ETA column format. */
export function formatEtaLabel(datetimeLocal: string): string {
  if (!datetimeLocal) return "—";
  const d = new Date(datetimeLocal);
  return Number.isNaN(d.getTime()) ? "—" : stamp(d, false);
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function createJob(input: NewJobInput): JobRecord {
  const customer = input.customer.trim();
  const slaHours = SLA_HOURS_BY_SERVICE[input.serviceType];
  const id = ALL_JOBS.reduce((max, j) => Math.max(max, j.id), 0) + 1;
  const nextNumber = ALL_JOBS.reduce((max, j) => {
    const n = Number(j.jobId.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 1023) + 1;

  const job: JobRecord = {
    id,
    jobId: `WO-${nextNumber}`,
    customer,
    serviceType: input.serviceType,
    technician: input.technician,
    priority: input.priority,
    status: input.status,
    etaLabel: formatEtaLabel(input.scheduleStart),
    slaLabel: input.status === "Cancelled" ? "SLA: —" : `SLA: ${slaHours} hrs`,
    slaHours,
    slaBreached: false,
    region: input.region,
    createdAt: stamp(new Date()),
  };

  ALL_JOBS.unshift(job);

  JOB_EXTRAS[id] = {
    jobTitle: input.jobTitle.trim(),
    description: input.description.trim(),
    scheduleStart: input.scheduleStart,
    scheduleEnd: input.scheduleEnd,
    productModel: input.productModel.trim(),
    serialNumber: input.serialNumber.trim(),
    notes: input.notes.trim(),
  };

  // Fold the contact block into the shared directory so the details screen
  // shows what was entered instead of its generated placeholder.
  const composedAddress = [input.address, input.city, input.state, input.pincode]
    .map(p => p.trim()).filter(Boolean).join(", ");
  const existing = CUSTOMER_DIRECTORY[customer];
  if (composedAddress || input.email.trim() || input.phone.trim()) {
    CUSTOMER_DIRECTORY[customer] = {
      phone:   input.phone.trim()   || existing?.phone   || "—",
      email:   input.email.trim()   || existing?.email   || `facility@${slugify(customer)}.com`,
      address: composedAddress      || existing?.address || `${customer}, ${input.city.trim() || input.region}`,
    };
  }

  return job;
}

// ─────────────────────────────────────────────
//  Job workspace — everything the details screen
//  lets a user add or change after creation.
//  Same session-scoped, in-memory model as ALL_JOBS.
// ─────────────────────────────────────────────

export interface JobPhoto      { id: string; name: string; src: string; at: string }
export interface JobNote       { id: string; text: string; author: string; at: string }
export interface JobAttachment { id: string; name: string; size: string }
export interface JobPart       { item: string; qty: number; rate: number }
export interface JobActivity   { label: string; at: string }
export interface JobInvoice    { number: string; generatedAt: string }

export interface JobWorkspace {
  photos: JobPhoto[];
  /** Guards the one-time seeding of the job's pre-existing site photos. */
  photosSeeded: boolean;
  notes: JobNote[];
  attachments: JobAttachment[];
  /** Parts added on this screen, appended to the service-type defaults. */
  extraParts: JobPart[];
  /** Entries logged by user actions, appended after the derived history. */
  activity: JobActivity[];
  invoice: JobInvoice | null;
  /** null until the user ticks something — then it owns the checklist. */
  checklist: boolean[] | null;
}

const DEFAULT_ATTACHMENTS: JobAttachment[] = [
  { id: "seed-1", name: "Work Order.pdf",         size: "245 KB" },
  { id: "seed-2", name: "Customer Complaint.jpg", size: "1.2 MB" },
  { id: "seed-3", name: "Quotation.pdf",          size: "180 KB" },
];

const WORKSPACES: Record<number, JobWorkspace> = {};

export function getWorkspace(id: number): JobWorkspace {
  if (!WORKSPACES[id]) {
    WORKSPACES[id] = {
      photos: [], photosSeeded: false, notes: [],
      attachments: DEFAULT_ATTACHMENTS.map(a => ({ ...a })),
      extraParts: [], activity: [], invoice: null, checklist: null,
    };
  }
  return WORKSPACES[id];
}

/**
 * Materialise the job's pre-existing on-site photos once, so uploads and
 * deletions operate on a single list. Seeded entries carry no src and render
 * as placeholder tiles.
 */
export function seedJobPhotos(id: number, count: number): void {
  const ws = getWorkspace(id);
  if (ws.photosSeeded) return;
  ws.photosSeeded = true;
  for (let i = 0; i < count; i++) {
    ws.photos.push({ id: uid("photo"), name: `Site photo ${i + 1}.jpg`, src: "", at: "" });
  }
}

let seq = 0;
const uid = (prefix: string) => `${prefix}-${++seq}`;

/** Timestamp in the same format as JobRecord.createdAt. */
export const nowStamp = (): string => stamp(new Date());

export function logActivity(id: number, label: string): void {
  getWorkspace(id).activity.push({ label, at: nowStamp() });
}

/** Patch a job in place. SLA and ETA are re-derived from the new values. */
export function updateJob(id: number, patch: Partial<Omit<JobRecord, "id" | "jobId">>): JobRecord | undefined {
  const job = ALL_JOBS.find(j => j.id === id);
  if (!job) return undefined;

  Object.assign(job, patch);

  if (patch.serviceType) job.slaHours = SLA_HOURS_BY_SERVICE[patch.serviceType];
  if (patch.serviceType || patch.status) {
    job.slaLabel = job.status === "Cancelled" ? "SLA: —" : `SLA: ${job.slaHours} hrs`;
  }
  if (job.status === "Completed" || job.status === "Cancelled") job.slaBreached = false;

  return job;
}

/** Edit-form counterpart of NewJobInput — the fields the edit drawer owns. */
export interface EditJobInput {
  customer: string;
  serviceType: ServiceType;
  priority: JobPriority;
  status: JobStatus;
  technician: string;
  region: string;
  jobTitle: string;
  description: string;
  scheduleStart: string;
  scheduleEnd: string;
  productModel: string;
  serialNumber: string;
  notes: string;
  phone: string;
  email: string;
  address: string;
}

export function editJob(id: number, input: EditJobInput): JobRecord | undefined {
  const job = updateJob(id, {
    customer: input.customer.trim(),
    serviceType: input.serviceType,
    priority: input.priority,
    status: input.status,
    technician: input.technician,
    region: input.region,
    ...(input.scheduleStart ? { etaLabel: formatEtaLabel(input.scheduleStart) } : {}),
  });
  if (!job) return undefined;

  JOB_EXTRAS[id] = {
    ...(JOB_EXTRAS[id] ?? { jobTitle: "", description: "", scheduleStart: "", scheduleEnd: "", productModel: "", serialNumber: "", notes: "" }),
    jobTitle: input.jobTitle.trim(),
    description: input.description.trim(),
    scheduleStart: input.scheduleStart,
    scheduleEnd: input.scheduleEnd,
    productModel: input.productModel.trim(),
    serialNumber: input.serialNumber.trim(),
    notes: input.notes.trim(),
  };

  if (input.phone.trim() || input.email.trim() || input.address.trim()) {
    const existing = CUSTOMER_DIRECTORY[job.customer];
    CUSTOMER_DIRECTORY[job.customer] = {
      phone:   input.phone.trim()   || existing?.phone   || "—",
      email:   input.email.trim()   || existing?.email   || `facility@${slugify(job.customer)}.com`,
      address: input.address.trim() || existing?.address || job.customer,
    };
  }

  logActivity(id, `Job ${job.jobId} details updated`);
  return job;
}

export function addJobPhotos(id: number, files: { name: string; src: string }[]): JobPhoto[] {
  const ws = getWorkspace(id);
  const added = files.map(f => ({ id: uid("photo"), name: f.name, src: f.src, at: nowStamp() }));
  ws.photos.push(...added);
  logActivity(id, `${added.length} photo${added.length > 1 ? "s" : ""} uploaded`);
  return added;
}

export function removeJobPhoto(id: number, photoId: string): void {
  const ws = getWorkspace(id);
  const photo = ws.photos.find(p => p.id === photoId);
  ws.photos = ws.photos.filter(p => p.id !== photoId);
  if (photo) logActivity(id, `Photo "${photo.name}" removed`);
}

export function addJobNote(id: number, text: string, author = "Admin"): JobNote {
  const note = { id: uid("note"), text: text.trim(), author, at: nowStamp() };
  getWorkspace(id).notes.unshift(note);
  logActivity(id, "Internal note added");
  return note;
}

export function removeJobNote(id: number, noteId: string): void {
  const ws = getWorkspace(id);
  ws.notes = ws.notes.filter(n => n.id !== noteId);
}

export function addJobAttachments(id: number, files: { name: string; size: string }[]): void {
  const ws = getWorkspace(id);
  ws.attachments.push(...files.map(f => ({ id: uid("att"), name: f.name, size: f.size })));
  logActivity(id, `${files.length} file${files.length > 1 ? "s" : ""} attached`);
}

export function removeJobAttachment(id: number, attachmentId: string): void {
  const ws = getWorkspace(id);
  ws.attachments = ws.attachments.filter(a => a.id !== attachmentId);
}

export function addJobPart(id: number, part: JobPart): void {
  getWorkspace(id).extraParts.push(part);
  logActivity(id, `Part added — ${part.item} × ${part.qty}`);
}

export function removeJobPart(id: number, index: number): void {
  const ws = getWorkspace(id);
  ws.extraParts = ws.extraParts.filter((_, i) => i !== index);
}

export function generateInvoice(id: number): JobInvoice {
  const ws = getWorkspace(id);
  const job = ALL_JOBS.find(j => j.id === id);
  ws.invoice = { number: `INV-${job?.jobId.replace("WO-", "") ?? id}`, generatedAt: nowStamp() };
  logActivity(id, `Invoice ${ws.invoice.number} generated`);
  return ws.invoice;
}

export function setJobChecklist(id: number, checklist: boolean[]): void {
  getWorkspace(id).checklist = checklist;
}

/** Human-readable size for an uploaded File. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Pre-fills the edit drawer from whatever the job currently holds. */
export function toEditInput(job: JobRecord): EditJobInput {
  const extras = JOB_EXTRAS[job.id];
  const contact = CUSTOMER_DIRECTORY[job.customer];
  return {
    customer: job.customer,
    serviceType: job.serviceType,
    priority: job.priority,
    status: job.status,
    technician: job.technician,
    region: job.region,
    jobTitle: extras?.jobTitle ?? "",
    description: extras?.description ?? "",
    scheduleStart: extras?.scheduleStart ?? "",
    scheduleEnd: extras?.scheduleEnd ?? "",
    productModel: extras?.productModel ?? "",
    serialNumber: extras?.serialNumber ?? "",
    notes: extras?.notes ?? "",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    address: contact?.address ?? "",
  };
}
