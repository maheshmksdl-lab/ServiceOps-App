"use client";
import SourceReportLink from "@/components/shared/SourceReportLink";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const STAGES_LIGHT = [
  { name: "Qualification", deals: 425, color: "#78350F" },
  { name: "Needs Analysis", deals: 287, color: "#D97706" },
  { name: "Value Prop.", deals: 198, color: "#F59E0B" },
  { name: "Decision", deals: 156, color: "#FBBF24" },
  { name: "Proposal", deals: 124, color: "#FCD34D" },
  { name: "Negotiation", deals: 93, color: "#C2410C" },
];

const STAGES_DARK = [
  { name: "Qualification", deals: 425, color: "#F59E0B" },
  { name: "Needs Analysis", deals: 287, color: "#FBBF24" },
  { name: "Value Prop.", deals: 198, color: "#FCD34D" },
  { name: "Decision", deals: 156, color: "#D97706" },
  { name: "Proposal", deals: 124, color: "#C2410C" },
  { name: "Negotiation", deals: 93, color: "#FDE68A" },
];

const TOTAL = STAGES_LIGHT.reduce((s, d) => s + d.deals, 0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pct = ((payload[0].value / TOTAL) * 100).toFixed(1);
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-white/10">
      <p className="text-slate-400 text-[12px] mb-1">{label}</p>
      <p className="font-bold text-[15px]">{payload[0].value} deals</p>
      <p className="text-slate-400 text-[12px] mt-0.5">{pct}% of pipeline</p>
    </div>
  );
};

export default function DealStageChart({ isDark = false }: { isDark?: boolean }) {
  const stages = isDark ? STAGES_DARK : STAGES_LIGHT;
  return (
    <div className="rounded-2xl p-6 border h-full backdrop-blur-xl transition-colors duration-300"
      style={{
        backgroundColor: "#ffffff",
        borderColor: isDark ? "#4B2F1C" : "rgba(245,158,11,0.2)",
        boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.24)" : "0 8px 32px rgba(120,53,15,0.08)",
      }}>
      <div className="mb-5">
        <h3 className={`m-0 text-[14px] font-bold ${isDark ? "text-[#FFF3D6]" : "text-[#78350F]"}`}>Pipeline by Stage</h3>
        <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>Active deals distribution</p>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <BarChart
          data={stages}
          layout="vertical"
          margin={{ top: 0, right: 28, left: 0, bottom: 0 }}
          barSize={11}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: isDark ? "#D0A966" : "#9B6F3F", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={82}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "#2D180D" : "#FAF2DB" }} />
          <Bar dataKey="deals" radius={[0, 6, 6, 0]}>
            <LabelList
              dataKey="deals"
              position="right"
              style={{ fontSize: 10.5, fill: "#94A3B8", fontWeight: 600 }}
            />
            {stages.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <SourceReportLink reportId="r2" reportName="Deal with Stage" isDark={isDark} className="-mx-6 -mb-6 mt-4 rounded-b-2xl" />
    </div>
  );
}

