"use client";
import SourceReportLink from "@/components/shared/SourceReportLink";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const data = [
  { month: "Dec '25", revenue: 180000 },
  { month: "Jan '26", revenue: 195200 },
  { month: "Feb '26", revenue: 188500 },
  { month: "Mar '26", revenue: 210300 },
  { month: "Apr '26", revenue: 225100 },
  { month: "May '26", revenue: 234800 },
];

const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pct = payload[0].value === data[0].revenue
    ? 0
    : (((payload[0].value - data[0].revenue) / data[0].revenue) * 100).toFixed(1);
  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs shadow-2xl border border-white/10">
      <p className="text-slate-400 mb-1 text-[12px]">{label}</p>
      <p className="font-extrabold text-[17px] tracking-tight">{fmt(payload[0].value)}</p>
      {Number(pct) !== 0 && (
        <p className="text-emerald-400 text-[12px] mt-0.5">+{pct}% vs Dec</p>
      )}
    </div>
  );
};

export default function RevenueChart({ isDark = false }: { isDark?: boolean }) {
  const avg = data.reduce((s, d) => s + d.revenue, 0) / data.length;
  const chartStroke = isDark ? "#FBBF24" : "#F59E0B";

  return (
    <div className="rounded-2xl p-6 border h-full backdrop-blur-xl transition-colors duration-300"
      style={{
        backgroundColor: "#ffffff",
        borderColor: isDark ? "#4B2F1C" : "rgba(245,158,11,0.2)",
        boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.24)" : "0 8px 32px rgba(120,53,15,0.08)",
      }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`m-0 text-[14px] font-bold ${isDark ? "text-[#FFF3D6]" : "text-[#78350F]"}`}>Revenue Trend</h3>
          <p className={`text-[12px] mt-0.5 ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>Booked revenue · last 6 months</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${isDark ? "bg-[#2D180D] text-[#FCD34D]" : "bg-[#FAF2DB] text-[#78350F]"}`}>
          ↑ 30.4% growth
        </span>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#4B2F1C" : "#FDE68A"} vertical={false} />
          <ReferenceLine y={avg} stroke={isDark ? "#4B2F1C" : "#FDE68A"} strokeDasharray="4 3" label={{ value: "avg", fontSize: 9, fill: isDark ? "#D0A966" : "#9B6F3F" }} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: isDark ? "#D0A966" : "#9B6F3F", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: isDark ? "#D0A966" : "#9B6F3F" }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: chartStroke, strokeWidth: 1, strokeDasharray: "4 3" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={chartStroke}
            strokeWidth={2.5}
            fill={chartStroke}
            fillOpacity={isDark ? 0.15 : 0.06}
            dot={false}
            activeDot={{ r: 5, fill: chartStroke, stroke: isDark ? "#0A0A0A" : "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <SourceReportLink reportId="r4" reportName="Account Wise Deal Summary" isDark={isDark} className="-mx-6 -mb-6 mt-4 rounded-b-2xl" />
    </div>
  );
}

