"use client";
import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@/components/ThemeContext";
import { useJobFieldSx } from "@/components/jobs/jobFormStyles";
import {
  STATUS_ORDER, TECHNICIANS, TECHNICIAN_AVATARS, TECHNICIAN_RATINGS,
  type JobStatus, type JobRecord, type JobPart,
} from "@/lib/jobsData";

export type JobDialogKind =
  | "assign" | "status" | "invoice" | "followUp" | "close" | "addPart" | null;

// ── Shared chrome ──────────────────────────────
function useDialogSx() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    paper: {
      borderRadius: "16px",
      bgcolor: isDark ? "#0F0F0F" : "#FFFDF7",
      border: `1px solid ${isDark ? "#27272A" : "var(--serviceops-soft)"}`,
      backgroundImage: "none",
      width: "100%", maxWidth: 440,
    },
    title: {
      fontFamily: "var(--font-heading), sans-serif",
      fontSize: "16px", fontWeight: 700,
      color: isDark ? "#F4F4F5" : "#0F172A",
      px: 3, pt: 2.5, pb: 1,
    },
    cancel: {
      color: isDark ? "#A1A1AA" : "#64748B",
      textTransform: "none", fontWeight: 600, fontSize: "0.86rem", borderRadius: "9px", px: 2.5,
    },
    confirm: {
      bgcolor: isDark ? "#27272A" : "var(--serviceops-primary)",
      color: isDark ? "#F4F4F5" : "#3B1F00",
      borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.86rem", px: 3,
      boxShadow: isDark ? "none" : "0 1px 8px 0 rgba(245,158,11,0.35)",
      "&:hover": { bgcolor: isDark ? "#3F3F46" : "var(--serviceops-action)" },
      "&.Mui-disabled": { bgcolor: isDark ? "#18181B" : "var(--serviceops-soft)", color: isDark ? "#52525B" : "#8A6A38" },
    },
    danger: {
      bgcolor: "#EF4444", color: "#fff",
      borderRadius: "9px", textTransform: "none", fontWeight: 700, fontSize: "0.86rem", px: 3,
      "&:hover": { bgcolor: "#DC2626" },
    },
  };
}

interface Props {
  kind: JobDialogKind;
  job: JobRecord;
  onClose: () => void;
  onAssign: (technician: string) => void;
  onStatus: (status: JobStatus) => void;
  onInvoice: () => void;
  onFollowUp: (when: string, note: string) => void;
  onCloseJob: (resolution: string) => void;
  onAddPart: (part: JobPart) => void;
}

export default function JobActionDialogs({
  kind, job, onClose, onAssign, onStatus, onInvoice, onFollowUp, onCloseJob, onAddPart,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const S = useDialogSx();
  const FX = useJobFieldSx();

  const [technician, setTechnician] = useState(job.technician);
  const [status, setStatus]         = useState<JobStatus>(job.status);
  const [followWhen, setFollowWhen] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [part, setPart]             = useState({ item: "", qty: "1", rate: "" });

  // Re-seed from the record each time a dialog opens.
  useEffect(() => {
    if (!kind) return;
    setTechnician(job.technician);
    setStatus(job.status);
    setFollowWhen("");
    setFollowNote("");
    setResolution("");
    setPart({ item: "", qty: "1", rate: "" });
  }, [kind, job.technician, job.status]);

  const MI = { fontSize: "0.86rem" };
  const partQty = Number(part.qty);
  const partRate = Number(part.rate);
  const partValid = part.item.trim() !== "" && partQty > 0 && partRate >= 0 && !Number.isNaN(partRate) && part.rate !== "";

  return (
    <>
      {/* ── Assign / reassign technician ── */}
      <Dialog open={kind === "assign"} onClose={onClose} PaperProps={{ sx: S.paper }}>
        <DialogTitle sx={S.title}>Assign Technician</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <p className={`m-0 mb-3 text-[13px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
            Currently assigned to <span className="font-semibold">{job.technician}</span>.
          </p>
          <div className="space-y-1.5 -mx-1">
            {TECHNICIANS.map(t => {
              const rating = TECHNICIAN_RATINGS[t];
              const active = t === technician;
              return (
                <button key={t} onClick={() => setTechnician(t)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl border text-left transition-colors ${
                    active
                      ? isDark ? "border-[var(--serviceops-primary)] bg-[#1C1710]" : "border-[var(--serviceops-primary)] bg-[var(--serviceops-tint)]"
                      : isDark ? "border-[#27272A] hover:bg-[#18181B]" : "border-[var(--serviceops-soft)] hover:bg-[var(--serviceops-surface)]"
                  }`}>
                  <Avatar src={TECHNICIAN_AVATARS[t]} sx={{ width: 32, height: 32 }} />
                  <div className="flex-1 min-w-0">
                    <p className={`m-0 text-[13.5px] font-semibold ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>{t}</p>
                    <p className={`m-0 text-[11.5px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                      ★ {rating.rating} · {rating.jobs} jobs
                    </p>
                  </div>
                  {active && <span className="text-[11px] font-bold text-[var(--serviceops-primary)]">Selected</span>}
                </button>
              );
            })}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} sx={S.cancel}>Cancel</Button>
          <Button variant="contained" sx={S.confirm} disabled={technician === job.technician}
            onClick={() => { onAssign(technician); onClose(); }}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Change status ── */}
      <Dialog open={kind === "status"} onClose={onClose} PaperProps={{ sx: S.paper }}>
        <DialogTitle sx={S.title}>Change Status</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <p className={`m-0 mb-3 text-[13px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
            {job.jobId} is currently <span className="font-semibold">{job.status}</span>.
          </p>
          <FormControl size="small" fullWidth sx={FX}>
            <InputLabel>New Status</InputLabel>
            <Select label="New Status" value={status} onChange={e => setStatus(e.target.value as JobStatus)}>
              {STATUS_ORDER.map(s => <MenuItem key={s} value={s} sx={MI}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} sx={S.cancel}>Cancel</Button>
          <Button variant="contained" sx={S.confirm} disabled={status === job.status}
            onClick={() => { onStatus(status); onClose(); }}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Generate invoice ── */}
      <Dialog open={kind === "invoice"} onClose={onClose} PaperProps={{ sx: S.paper }}>
        <DialogTitle sx={S.title}>Generate Invoice</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <p className={`m-0 text-[13px] leading-relaxed ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
            An invoice will be raised for <span className="font-semibold">{job.jobId}</span> covering all
            labour and parts currently recorded against this job. It will appear on the Invoice tab and can
            be printed straight away.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} sx={S.cancel}>Cancel</Button>
          <Button variant="contained" sx={S.confirm} onClick={() => { onInvoice(); onClose(); }}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Schedule follow-up ── */}
      <Dialog open={kind === "followUp"} onClose={onClose} PaperProps={{ sx: S.paper }}>
        <DialogTitle sx={S.title}>Schedule Follow-up</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <p className={`m-0 mb-3 text-[13px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
            Raises a linked {job.serviceType} job for {job.customer}.
          </p>
          <div className="space-y-3">
            <TextField label="Follow-up Date & Time" type="datetime-local" value={followWhen}
              onChange={e => setFollowWhen(e.target.value)} size="small" fullWidth
              InputLabelProps={{ shrink: true }} sx={FX} />
            <TextField label="Reason / Notes" value={followNote} onChange={e => setFollowNote(e.target.value)}
              size="small" fullWidth multiline rows={3} sx={FX} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} sx={S.cancel}>Cancel</Button>
          <Button variant="contained" sx={S.confirm} disabled={!followWhen}
            onClick={() => { onFollowUp(followWhen, followNote); onClose(); }}>
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Close job ── */}
      <Dialog open={kind === "close"} onClose={onClose} PaperProps={{ sx: S.paper }}>
        <DialogTitle sx={S.title}>Close Job</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <p className={`m-0 mb-3 text-[13px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
            {job.jobId} will be marked <span className="font-semibold">Completed</span> and its timeline
            closed out.
          </p>
          <TextField label="Resolution Summary" value={resolution} onChange={e => setResolution(e.target.value)}
            size="small" fullWidth multiline rows={3} sx={FX} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} sx={S.cancel}>Cancel</Button>
          <Button variant="contained" sx={S.danger} onClick={() => { onCloseJob(resolution); onClose(); }}>
            Close Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add part ── */}
      <Dialog open={kind === "addPart"} onClose={onClose} PaperProps={{ sx: S.paper }}>
        <DialogTitle sx={S.title}>Add Part / Material</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <div className="space-y-3 pt-1">
            <TextField label="Item" value={part.item} onChange={e => setPart(p => ({ ...p, item: e.target.value }))}
              size="small" fullWidth sx={FX} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Quantity" type="number" value={part.qty}
                onChange={e => setPart(p => ({ ...p, qty: e.target.value }))}
                size="small" fullWidth inputProps={{ min: 1 }} sx={FX} />
              <TextField label="Rate (₹)" type="number" value={part.rate}
                onChange={e => setPart(p => ({ ...p, rate: e.target.value }))}
                size="small" fullWidth inputProps={{ min: 0 }} sx={FX} />
            </div>
            {partValid && (
              <p className={`m-0 text-[12.5px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
                Amount: <span className="font-bold">₹{(partQty * partRate).toLocaleString("en-IN")}</span>
              </p>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button onClick={onClose} sx={S.cancel}>Cancel</Button>
          <Button variant="contained" sx={S.confirm} disabled={!partValid}
            onClick={() => { onAddPart({ item: part.item.trim(), qty: partQty, rate: partRate }); onClose(); }}>
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
