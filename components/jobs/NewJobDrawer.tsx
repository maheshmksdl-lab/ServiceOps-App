"use client";
import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { X, Briefcase, WarningCircle } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeContext";
import { useJobFieldSx } from "@/components/jobs/jobFormStyles";
import {
  SERVICE_TYPE_ORDER, STATUS_ORDER, TECHNICIANS, CUSTOMER_DIRECTORY, REGIONS, PRODUCT_MODELS,
  type ServiceType, type JobPriority, type JobStatus, type NewJobInput,
} from "@/lib/jobsData";

const PRIORITIES: JobPriority[] = ["High", "Medium", "Low"];

// Only the states a brand-new job can legitimately open in.
const CREATABLE_STATUSES: JobStatus[] = ["Scheduled", "Assigned", "On Route", "In Progress", "On Hold"];

const DEFAULT_FORM = {
  customer: "",
  address: "",
  email: "",
  city: "",
  phone: "",
  state: "",
  pincode: "",
  region: "",
  serviceType: "" as ServiceType | "",
  priority: "" as JobPriority | "",
  status: "Scheduled" as JobStatus,
  jobTitle: "",
  description: "",
  scheduleStart: "",
  scheduleEnd: "",
  technician: "",
  productModel: "",
  serialNumber: "",
  notes: "",
};

type FormState = typeof DEFAULT_FORM;
type Errors = Partial<Record<keyof FormState, string>>;

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <h3 className={`font-heading text-[12px] font-bold uppercase tracking-wider mb-3.5 ${theme === "dark" ? "text-[#D4D4D8]" : "text-slate-600"}`}>
      {children}
    </h3>
  );
}

function validate(form: FormState): Errors {
  const errors: Errors = {};

  if (!form.customer.trim())   errors.customer   = "Customer is required";
  if (!form.region)            errors.region     = "Territory is required";
  if (!form.serviceType)       errors.serviceType = "Job type is required";
  if (!form.priority)          errors.priority   = "Priority is required";
  if (!form.jobTitle.trim())   errors.jobTitle   = "Job title is required";
  if (!form.technician)        errors.technician = "Service resource is required";
  if (!form.scheduleStart)     errors.scheduleStart = "Schedule start is required";
  if (!form.scheduleEnd)       errors.scheduleEnd   = "Schedule end is required";

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
    errors.email = "Enter a valid email address";

  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10)
    errors.phone = "Enter a valid phone number";

  if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
    errors.pincode = "Pincode must be 6 digits";

  if (form.scheduleStart && form.scheduleEnd) {
    const start = new Date(form.scheduleStart);
    const end = new Date(form.scheduleEnd);
    if (end <= start) errors.scheduleEnd = "End must be after start";
  }

  return errors;
}

interface Props {
  open: boolean;
  onClose: () => void;
  customers: string[];
  onSubmit: (input: NewJobInput) => void;
}

export default function NewJobDrawer({ open, onClose, customers, onSubmit }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const FX = useJobFieldSx();

  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [errors, setErrors] = useState<Errors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Picking a known customer pre-fills its contact block; free-typing a new
  // customer name leaves whatever has already been entered untouched.
  const applyCustomer = (value: string) => {
    const known = CUSTOMER_DIRECTORY[value];
    setForm(prev => ({
      ...prev,
      customer: value,
      ...(known ? { phone: known.phone, email: known.email, address: known.address } : {}),
    }));
    setErrors(prev => {
      const next = { ...prev };
      delete next.customer;
      if (known) { delete next.phone; delete next.email; }
      return next;
    });
  };

  const reset = () => {
    setForm({ ...DEFAULT_FORM });
    setErrors({});
    setShowSummary(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setShowSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 450)); // stand-in for the create call
      onSubmit({
        ...form,
        customer: form.customer.trim(),
        serviceType: form.serviceType as ServiceType,
        priority: form.priority as JobPriority,
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const modelOptions = form.serviceType ? PRODUCT_MODELS[form.serviceType] : [];

  const MENU_ITEM_SX = { fontSize: "0.84rem" };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 620, md: 760 },
          display: "flex",
          flexDirection: "column",
          bgcolor: isDark ? "#0F0F0F" : "#FFFDF7",
          borderLeft: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`,
          boxShadow: isDark ? "-12px 0 48px rgba(0,0,0,0.5)" : "-12px 0 48px rgba(120,53,15,0.10)",
        },
      }}
    >
      {/* ══ Header ══ */}
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-primary)]"}`}>
            <Briefcase size={18} color={isDark ? "#A1A1AA" : "#3B1F00"} weight="duotone" />
          </div>
          <div>
            <h2 className={`m-0 font-heading text-[16px] font-bold tracking-tight ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>Add Jobs</h2>
            <p className={`m-0 text-[11.5px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Create a new field service work order</p>
          </div>
        </div>
        <Tooltip title="Close">
          <span>
            <IconButton size="small" onClick={handleClose} disabled={submitting}
              sx={{ borderRadius: "9px", border: `1.5px solid ${isDark ? "#3F3F46" : "var(--serviceops-soft)"}`, "&:hover": { bgcolor: isDark ? "#27272A" : "var(--serviceops-surface)" } }}>
              <X size={17} color={isDark ? "#71717A" : "#64748B"} weight="duotone" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {/* ══ Scrollable body ══ */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {showSummary && errorCount > 0 && (
          <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${isDark ? "bg-[rgba(239,68,68,0.10)] border-[rgba(239,68,68,0.35)]" : "bg-[#FEF2F2] border-[#FECACA]"}`}>
            <WarningCircle size={16} color="#EF4444" weight="fill" className="mt-[1px] flex-shrink-0" />
            <p className="m-0 text-[12.5px] font-medium text-[#EF4444]">
              {errorCount} field{errorCount > 1 ? "s need" : " needs"} attention before this job can be created.
            </p>
          </div>
        )}

        {/* ── Customer Details ── */}
        <div>
          <SectionTitle>Customer Details</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Autocomplete
              freeSolo
              options={customers}
              value={form.customer}
              onChange={(_, value) => applyCustomer(value ?? "")}
              onInputChange={(_, value, reason) => { if (reason === "input") applyCustomer(value); }}
              renderInput={params => (
                <TextField {...params} label="Search Customer *" size="small"
                  error={!!errors.customer} helperText={errors.customer} sx={FX} />
              )}
            />
            <TextField label="Address" value={form.address} onChange={e => set("address", e.target.value)}
              size="small" fullWidth multiline rows={2} sx={FX} />

            <TextField label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)}
              error={!!errors.email} helperText={errors.email} size="small" fullWidth sx={FX} />
            <TextField label="City" value={form.city} onChange={e => set("city", e.target.value)}
              size="small" fullWidth sx={FX} />

            <TextField label="Phone" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              error={!!errors.phone} helperText={errors.phone} size="small" fullWidth sx={FX} />
            <TextField label="State" value={form.state} onChange={e => set("state", e.target.value)}
              size="small" fullWidth sx={FX} />

            <TextField label="Pincode" value={form.pincode} onChange={e => set("pincode", e.target.value)}
              error={!!errors.pincode} helperText={errors.pincode} size="small" fullWidth sx={FX} />
            <FormControl size="small" fullWidth error={!!errors.region} sx={FX}>
              <InputLabel>Territory *</InputLabel>
              <Select label="Territory *" value={form.region} onChange={e => set("region", e.target.value)}>
                {REGIONS.map(r => <MenuItem key={r} value={r} sx={MENU_ITEM_SX}>{r}</MenuItem>)}
              </Select>
              {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
            </FormControl>
          </div>
        </div>

        <Divider sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />

        {/* ── Job Information ── */}
        <div>
          <SectionTitle>Job Information</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormControl size="small" fullWidth error={!!errors.serviceType} sx={FX}>
              <InputLabel>Job Type *</InputLabel>
              <Select label="Job Type *" value={form.serviceType}
                onChange={e => {
                  set("serviceType", e.target.value as ServiceType);
                  set("productModel", ""); // model list is scoped to the job type
                }}>
                {SERVICE_TYPE_ORDER.map(t => <MenuItem key={t} value={t} sx={MENU_ITEM_SX}>{t}</MenuItem>)}
              </Select>
              {errors.serviceType && <FormHelperText>{errors.serviceType}</FormHelperText>}
            </FormControl>

            <FormControl size="small" fullWidth error={!!errors.priority} sx={FX}>
              <InputLabel>Priority *</InputLabel>
              <Select label="Priority *" value={form.priority} onChange={e => set("priority", e.target.value as JobPriority)}>
                {PRIORITIES.map(p => <MenuItem key={p} value={p} sx={MENU_ITEM_SX}>{p}</MenuItem>)}
              </Select>
              {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
            </FormControl>

            <div className="sm:col-span-2">
              <TextField label="Job Title *" value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)}
                error={!!errors.jobTitle} helperText={errors.jobTitle} size="small" fullWidth sx={FX} />
            </div>

            <div className="sm:col-span-2">
              <TextField label="Description" value={form.description} onChange={e => set("description", e.target.value)}
                size="small" fullWidth multiline rows={3} sx={FX} />
            </div>

            <TextField label="Schedule Start *" type="datetime-local" value={form.scheduleStart}
              onChange={e => set("scheduleStart", e.target.value)}
              error={!!errors.scheduleStart} helperText={errors.scheduleStart}
              size="small" fullWidth InputLabelProps={{ shrink: true }} sx={FX} />
            <TextField label="Schedule End *" type="datetime-local" value={form.scheduleEnd}
              onChange={e => set("scheduleEnd", e.target.value)}
              error={!!errors.scheduleEnd} helperText={errors.scheduleEnd}
              size="small" fullWidth InputLabelProps={{ shrink: true }} sx={FX} />

            <FormControl size="small" fullWidth error={!!errors.technician} sx={FX}>
              <InputLabel>Assigned Service Resource *</InputLabel>
              <Select label="Assigned Service Resource *" value={form.technician} onChange={e => set("technician", e.target.value)}>
                {TECHNICIANS.map(t => <MenuItem key={t} value={t} sx={MENU_ITEM_SX}>{t}</MenuItem>)}
              </Select>
              {errors.technician && <FormHelperText>{errors.technician}</FormHelperText>}
            </FormControl>

            <FormControl size="small" fullWidth sx={FX}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status} onChange={e => set("status", e.target.value as JobStatus)}>
                {STATUS_ORDER.filter(s => CREATABLE_STATUSES.includes(s)).map(s => (
                  <MenuItem key={s} value={s} sx={MENU_ITEM_SX}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        <Divider sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />

        {/* ── Product Information ── */}
        <div>
          <SectionTitle>Product Information</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormControl size="small" fullWidth disabled={!form.serviceType} sx={FX}>
              <InputLabel>Product Model</InputLabel>
              <Select label="Product Model" value={form.productModel} onChange={e => set("productModel", e.target.value)}>
                <MenuItem value="" sx={{ ...MENU_ITEM_SX, color: "#94A3B8" }}><em>None</em></MenuItem>
                {modelOptions.map(m => <MenuItem key={m} value={m} sx={MENU_ITEM_SX}>{m}</MenuItem>)}
              </Select>
              {!form.serviceType && <FormHelperText>Select a job type first</FormHelperText>}
            </FormControl>
            <TextField label="Serial Number" value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)}
              size="small" fullWidth sx={FX} />
          </div>
        </div>

        <Divider sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />

        {/* ── Notes ── */}
        <div>
          <SectionTitle>Notes</SectionTitle>
          <TextField label="Enter Notes" value={form.notes} onChange={e => set("notes", e.target.value)}
            size="small" fullWidth multiline rows={4} sx={FX} />
        </div>
      </div>

      {/* ══ Footer ══ */}
      <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0 ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
        <Button variant="text" onClick={handleClose} disabled={submitting}
          sx={{
            color: isDark ? "#A1A1AA" : "#64748B",
            textTransform: "none", fontWeight: 600, fontSize: "0.86rem", borderRadius: "9px", px: 2.5,
            "&:hover": { bgcolor: isDark ? "#27272A" : "var(--serviceops-surface)" },
          }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}
          startIcon={submitting ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : undefined}
          sx={{
            bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)",
            color: isDark ? "#F4F4F5" : "#3B1F00",
            borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.86rem", px: 3,
            boxShadow: isDark ? "none" : "0 1px 8px 0 rgba(245,158,11,0.35)",
            "&:hover":  { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)", boxShadow: isDark ? "none" : "0 2px 14px 0 rgba(245,158,11,0.38)" },
            "&:active": { bgcolor: isDark ? "#52525B" : "var(--serviceops-hover)" },
            "&.Mui-disabled": { bgcolor: isDark ? "#18181B" : "var(--serviceops-soft)", color: isDark ? "#52525B" : "#8A6A38" },
          }}>
          {submitting ? "Creating…" : "Submit"}
        </Button>
      </div>
    </Drawer>
  );
}
