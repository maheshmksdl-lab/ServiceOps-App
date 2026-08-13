"use client";
import { type JobRecord } from "@/lib/jobsData";

export type PrintKind = "card" | "invoice";

export interface PrintPayload {
  kind: PrintKind;
  job: JobRecord;
  customer: { phone: string; email: string; address: string };
  problem: string;
  category: string;
  asset: string;
  warranty: string;
  amcStatus: string;
  durationHrs: number;
  description: string;
  notes: string;
  parts: { item: string; qty: number; rate: number }[];
  labor: number;
  partsTotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: string;
  invoiceNumber: string | null;
  checklist: { label: string; done: boolean }[];
  timeline: { label: string; done: boolean }[];
  printedAt: string;
}

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "4px 12px 4px 0", color: "#555", whiteSpace: "nowrap", verticalAlign: "top" }}>{label}</td>
      <td style={{ padding: "4px 0", fontWeight: 600, verticalAlign: "top" }}>{value}</td>
    </tr>
  );
}

/**
 * Rendered into the DOM but hidden on screen — `@media print` in globals.css
 * flips it visible and hides the app shell, so window.print() picks up exactly
 * this sheet. Deliberately styled with plain inline CSS: print output should
 * be black-on-white regardless of the app theme.
 */
export default function JobPrintSheet({ payload }: { payload: PrintPayload | null }) {
  if (!payload) return null;
  const p = payload;
  const isInvoice = p.kind === "invoice";

  return (
    <div className="job-print-sheet" style={{ color: "#111", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, lineHeight: 1.45 }}>
      {/* Letterhead */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>ServiceOps</div>
          <div style={{ fontSize: 11, color: "#555" }}>Field Service Management</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{isInvoice ? "TAX INVOICE" : "JOB CARD"}</div>
          <div style={{ fontSize: 11, color: "#555" }}>
            {isInvoice && p.invoiceNumber ? `${p.invoiceNumber} · ` : ""}{p.job.jobId}
          </div>
          <div style={{ fontSize: 10, color: "#777" }}>Printed {p.printedAt}</div>
        </div>
      </div>

      {/* Customer + job meta */}
      <div style={{ display: "flex", gap: 28, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>Customer</div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.job.customer}</div>
          <div style={{ color: "#444" }}>{p.customer.address}</div>
          <div style={{ color: "#444" }}>{p.customer.phone} · {p.customer.email}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>Job</div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <Row label="Work Order" value={p.job.jobId} />
              <Row label="Status" value={p.job.status} />
              <Row label="Priority" value={p.job.priority} />
              <Row label="Created" value={p.job.createdAt} />
              <Row label="Technician" value={p.job.technician} />
              <Row label="Region" value={p.job.region} />
            </tbody>
          </table>
        </div>
      </div>

      {!isInvoice && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>Service Details</div>
          <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 14 }}>
            <tbody>
              <Row label="Service Type" value={p.job.serviceType} />
              <Row label="Problem Reported" value={p.problem} />
              <Row label="Category" value={p.category} />
              <Row label="Asset" value={p.asset} />
              <Row label="Warranty" value={p.warranty} />
              <Row label="AMC Status" value={p.amcStatus} />
              <Row label="Expected Duration" value={`${p.durationHrs} Hours`} />
              <Row label="ETA / SLA" value={`${p.job.etaLabel} · ${p.job.slaLabel}`} />
              {p.description && <Row label="Description" value={p.description} />}
              {p.notes && <Row label="Notes" value={p.notes} />}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 28, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>Work Checklist</div>
              {p.checklist.map(c => (
                <div key={c.label} style={{ padding: "2px 0" }}>
                  <span style={{ display: "inline-block", width: 14 }}>{c.done ? "☑" : "☐"}</span>{c.label}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>Progress</div>
              {p.timeline.map(t => (
                <div key={t.label} style={{ padding: "2px 0", color: t.done ? "#111" : "#999" }}>
                  <span style={{ display: "inline-block", width: 14 }}>{t.done ? "●" : "○"}</span>{t.label}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Charges */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>
        {isInvoice ? "Billed Items" : "Parts & Materials"}
      </div>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 10 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #111" }}>
            <th style={{ textAlign: "left", padding: "4px 0" }}>Item</th>
            <th style={{ textAlign: "right", padding: "4px 0", width: 50 }}>Qty</th>
            <th style={{ textAlign: "right", padding: "4px 0", width: 80 }}>Rate</th>
            <th style={{ textAlign: "right", padding: "4px 0", width: 90 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {p.parts.map((part, i) => (
            <tr key={`${part.item}-${i}`} style={{ borderBottom: "1px solid #E5E5E5" }}>
              <td style={{ padding: "4px 0" }}>{part.item}</td>
              <td style={{ padding: "4px 0", textAlign: "right" }}>{part.qty}</td>
              <td style={{ padding: "4px 0", textAlign: "right" }}>{money(part.rate)}</td>
              <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(part.qty * part.rate)}</td>
            </tr>
          ))}
          <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
            <td style={{ padding: "4px 0" }}>Labour Charges</td>
            <td style={{ padding: "4px 0", textAlign: "right" }}>1</td>
            <td style={{ padding: "4px 0", textAlign: "right" }}>{money(p.labor)}</td>
            <td style={{ padding: "4px 0", textAlign: "right", fontWeight: 600 }}>{money(p.labor)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ borderCollapse: "collapse", marginLeft: "auto", minWidth: 240 }}>
        <tbody>
          <Row label="Parts & Materials" value={money(p.partsTotal)} />
          <Row label="Labour" value={money(p.labor)} />
          <Row label="Tax (18%)" value={money(p.tax)} />
          <Row label="Discount" value={`- ${money(p.discount)}`} />
          <tr style={{ borderTop: "1.5px solid #111" }}>
            <td style={{ padding: "6px 12px 0 0", fontWeight: 800 }}>Total Amount</td>
            <td style={{ padding: "6px 0 0", fontWeight: 800, fontSize: 14 }}>{money(p.total)}</td>
          </tr>
          <Row label="Payment Status" value={p.paymentStatus} />
        </tbody>
      </table>

      {/* Sign-off */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 42, paddingTop: 8 }}>
        <div style={{ borderTop: "1px solid #111", paddingTop: 4, width: 190, fontSize: 11 }}>Technician Signature</div>
        <div style={{ borderTop: "1px solid #111", paddingTop: 4, width: 190, fontSize: 11, textAlign: "right" }}>Customer Signature</div>
      </div>
      <div style={{ marginTop: 18, fontSize: 10, color: "#777", textAlign: "center" }}>
        This is a computer-generated {isInvoice ? "invoice" : "job card"} and does not require a physical stamp.
      </div>
    </div>
  );
}
