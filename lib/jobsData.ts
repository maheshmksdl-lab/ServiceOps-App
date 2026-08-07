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

const idx = (i: number, len: number) => ((i % len) + len) % len;
const pad = (n: number) => String(n).length === 1 ? `0${n}` : `${n}`;

function formatDate(offsetHours: number): string {
  const base = new Date(2026, 4, 26, 9, 30); // 26 May 2026, 09:30
  const d = new Date(base.getTime() - offsetHours * 3600 * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  return `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(hours12)}:${pad(d.getMinutes())} ${ampm}`;
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
