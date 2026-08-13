"use client";
import { useEffect, useState } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";
import { X, PencilSimple, WarningCircle } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeContext";
import { useJobFieldSx } from "@/components/jobs/jobFormStyles";
import {
  SERVICE_TYPE_ORDER, STATUS_ORDER, TECHNICIANS, REGIONS, PRODUCT_MODELS,
  type ServiceType, type JobPriority, type JobStatus, type JobRecord, type EditJobInput,
} from "@/lib/jobsData";

const PRIORITIES: JobPriority[] = ["High", "Medium", "Low"];

type Errors = Partial<Record<keyof EditJobInput, string>>;

function validate(form: EditJobInput): Errors {
  const errors: Errors = {};
  if (!form.customer.trim()) errors.customer = "Customer is required";
  if (!form.jobTitle.trim()) errors.jobTitle = "Job title is required";
  if (!form.technician)      errors.technician = "Service resource is required";
  if (!form.region)          errors.region = "Territory is required";

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
    errors.email = "Enter a valid email address";
  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10)
    errors.phone = "Enter a valid phone number";
  if (form.scheduleStart && form.scheduleEnd && new Date(form.scheduleEnd) <= new Date(form.scheduleStart))
    errors.scheduleEnd = "End must be after start";

  return errors;
}

interface Props {
  open: boolean;
  job: JobRecord;
  initial: EditJobInput;
  onClose: () => void;
  onSave: (input: EditJobInput) => void;
}

export default function EditJobDrawer({ open, job, initial, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const FX = useJobFieldSx();

  const [form, setForm] = useState<EditJobInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Re-seed from the record every time the drawer opens so a cancelled edit
  // never leaks into the next one.
  useEffect(() => { if (open) { setForm(initial); setErrors({}); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof EditJobInput>(key: K, value: EditJobInput[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 350));
      onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(errors).length;
  const MI = { fontSize: "0.84rem" };

  return (
    <Drawer anchor="right" open={open} onClose={saving ? undefined : onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 620, md: 720 },
          display: "flex", flexDirection: "column",
          bgcolor: isDark ? "#0F0F0F" : "#FFFDF7",
          borderLeft: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`,
          boxShadow: isDark ? "-12px 0 48px rgba(0,0,0,0.5)" : "-12px 0 48px rgba(120,53,15,0.10)",
        },
      }}>

      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isDark ? "bg-[#27272A]" : "bg-[var(--serviceops-primary)]"}`}>
            <PencilSimple size={18} color={isDark ? "#A1A1AA" : "#3B1F00"} weight="duotone" />
          </div>
          <div>
            <h2 className={`m-0 font-heading text-[16px] font-bold tracking-tight ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>Edit Job</h2>
            <p className={`m-0 text-[11.5px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>{job.jobId} · {job.customer}</p>
          </div>
        </div>
        <Tooltip title="Close">
          <span>
            <IconButton size="small" onClick={onClose} disabled={saving}
              sx={{ borderRadius: "9px", border: `1.5px solid ${isDark ? "#3F3F46" : "var(--serviceops-soft)"}` }}>
              <X size={17} color={isDark ? "#71717A" : "#64748B"} weight="duotone" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {errorCount > 0 && (
          <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${isDark ? "bg-[rgba(239,68,68,0.10)] border-[rgba(239,68,68,0.35)]" : "bg-[#FEF2F2] border-[#FECACA]"}`}>
            <WarningCircle size={16} color="#EF4444" weight="fill" className="mt-[1px] flex-shrink-0" />
            <p className="m-0 text-[12.5px] font-medium text-[#EF4444]">
              {errorCount} field{errorCount > 1 ? "s need" : " needs"} attention before saving.
            </p>
          </div>
        )}

        <div>
          <h3 className={`font-heading text-[12px] font-bold uppercase tracking-wider mb-3.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>Customer Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Customer *" value={form.customer} onChange={e => set("customer", e.target.value)}
              error={!!errors.customer} helperText={errors.customer} size="small" fullWidth sx={FX} />
            <TextField label="Address" value={form.address} onChange={e => set("address", e.target.value)}
              size="small" fullWidth multiline rows={2} sx={FX} />
            <TextField label="Phone" value={form.phone} onChange={e => set("phone", e.target.value)}
              error={!!errors.phone} helperText={errors.phone} size="small" fullWidth sx={FX} />
            <TextField label="Email" value={form.email} onChange={e => set("email", e.target.value)}
              error={!!errors.email} helperText={errors.email} size="small" fullWidth sx={FX} />
          </div>
        </div>

        <Divider sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />

        <div>
          <h3 className={`font-heading text-[12px] font-bold uppercase tracking-wider mb-3.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>Job Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormControl size="small" fullWidth sx={FX}>
              <InputLabel>Job Type</InputLabel>
              <Select label="Job Type" value={form.serviceType}
                onChange={e => { set("serviceType", e.target.value as ServiceType); set("productModel", ""); }}>
                {SERVICE_TYPE_ORDER.map(t => <MenuItem key={t} value={t} sx={MI}>{t}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth sx={FX}>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={form.priority} onChange={e => set("priority", e.target.value as JobPriority)}>
                {PRIORITIES.map(p => <MenuItem key={p} value={p} sx={MI}>{p}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth sx={FX}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status} onChange={e => set("status", e.target.value as JobStatus)}>
                {STATUS_ORDER.map(s => <MenuItem key={s} value={s} sx={MI}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth error={!!errors.region} sx={FX}>
              <InputLabel>Territory *</InputLabel>
              <Select label="Territory *" value={form.region} onChange={e => set("region", e.target.value)}>
                {REGIONS.map(r => <MenuItem key={r} value={r} sx={MI}>{r}</MenuItem>)}
              </Select>
              {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
            </FormControl>

            <div className="sm:col-span-2">
              <TextField label="Job Title *" value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)}
                error={!!errors.jobTitle} helperText={errors.jobTitle} size="small" fullWidth sx={FX} />
            </div>
            <div className="sm:col-span-2">
              <TextField label="Description" value={form.description} onChange={e => set("description", e.target.value)}
                size="small" fullWidth multiline rows={3} sx={FX} />
            </div>

            <TextField label="Schedule Start" type="datetime-local" value={form.scheduleStart}
              onChange={e => set("scheduleStart", e.target.value)} size="small" fullWidth
              InputLabelProps={{ shrink: true }} sx={FX} />
            <TextField label="Schedule End" type="datetime-local" value={form.scheduleEnd}
              onChange={e => set("scheduleEnd", e.target.value)}
              error={!!errors.scheduleEnd} helperText={errors.scheduleEnd} size="small" fullWidth
              InputLabelProps={{ shrink: true }} sx={FX} />

            <div className="sm:col-span-2">
              <FormControl size="small" fullWidth error={!!errors.technician} sx={FX}>
                <InputLabel>Assigned Service Resource *</InputLabel>
                <Select label="Assigned Service Resource *" value={form.technician} onChange={e => set("technician", e.target.value)}>
                  {TECHNICIANS.map(t => <MenuItem key={t} value={t} sx={MI}>{t}</MenuItem>)}
                </Select>
                {errors.technician && <FormHelperText>{errors.technician}</FormHelperText>}
              </FormControl>
            </div>
          </div>
        </div>

        <Divider sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />

        <div>
          <h3 className={`font-heading text-[12px] font-bold uppercase tracking-wider mb-3.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>Product Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormControl size="small" fullWidth sx={FX}>
              <InputLabel>Product Model</InputLabel>
              <Select label="Product Model" value={form.productModel} onChange={e => set("productModel", e.target.value)}>
                <MenuItem value="" sx={{ ...MI, color: "#94A3B8" }}><em>None</em></MenuItem>
                {PRODUCT_MODELS[form.serviceType].map(m => <MenuItem key={m} value={m} sx={MI}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Serial Number" value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)}
              size="small" fullWidth sx={FX} />
          </div>
        </div>

        <Divider sx={{ borderColor: isDark ? "#27272A" : "var(--serviceops-soft)" }} />

        <div>
          <h3 className={`font-heading text-[12px] font-bold uppercase tracking-wider mb-3.5 ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>Notes</h3>
          <TextField label="Job Notes" value={form.notes} onChange={e => set("notes", e.target.value)}
            size="small" fullWidth multiline rows={3} sx={FX} />
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0 ${isDark ? "bg-[#111113] border-[#27272A]" : "bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"}`}>
        <Button variant="text" onClick={onClose} disabled={saving}
          sx={{ color: isDark ? "#A1A1AA" : "#64748B", textTransform: "none", fontWeight: 600, fontSize: "0.86rem", borderRadius: "9px", px: 2.5 }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : undefined}
          sx={{
            bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)",
            color: isDark ? "#F4F4F5" : "#3B1F00",
            borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.86rem", px: 3,
            boxShadow: isDark ? "none" : "0 1px 8px 0 rgba(245,158,11,0.35)",
            "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" },
            "&.Mui-disabled": { bgcolor: isDark ? "#18181B" : "var(--serviceops-soft)", color: isDark ? "#52525B" : "#8A6A38" },
          }}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </Drawer>
  );
}
