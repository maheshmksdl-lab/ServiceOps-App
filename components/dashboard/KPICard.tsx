"use client";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowSquareOut } from "@phosphor-icons/react";

interface KPICardProps {
  title: string;
  value: string;
  trend: number;
  icon: ReactNode;
  fill: string;          // soft pastel card background
  spark: string;         // deeper coordinating shade for the sparkline
  sparkData: number[];
  isDark?: boolean;
  sourceReportId?: string;
  sourceReportName?: string;
}

export default function KPICard({
  title,
  value,
  trend,
  icon,
  fill,
  spark,
  sparkData,
  isDark = false,
  sourceReportId,
  sourceReportName,
}: KPICardProps) {
  const router = useRouter();
  const isPositive = trend >= 0;

  const W = 76;
  const H = 30;
  const max = Math.max(...sparkData);
  const min = Math.min(...sparkData);
  const range = max - min || 1;

  const coords = sparkData.map((d, i) => ({
    x: (i / (sparkData.length - 1)) * W,
    y: H - ((d - min) / range) * (H - 5) - 2,
  }));

  const linePts = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPts = [
    `0,${H}`,
    ...coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`),
    `${W},${H}`,
  ].join(" ");

  return (
    <div
      className="rounded-xl sm:rounded-2xl p-4 sm:p-6 relative overflow-hidden border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
      style={{
        backgroundColor: isDark ? "#21160D" : fill,
        borderColor: isDark ? "#4B2F1C" : "rgba(245,158,11,0.2)",
        boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.24)" : "0 6px 24px rgba(120,53,15,0.08)",
      }}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        {/* ── Left: label + value + badge ── */}
        <div className="flex-1 min-w-0">
          <p className={`font-heading text-[10px] sm:text-[11.5px] font-semibold uppercase tracking-[0.1em] mb-2 truncate ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>
            {title}
          </p>
          <p className={`text-xl sm:text-[28px] font-extrabold tracking-tight leading-none mb-3 ${isDark ? "text-[#FFF3D6]" : "text-[#78350F]"}`}>
            {value}
          </p>
          <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full ${isDark ? "bg-[#2D180D]" : "bg-[#FFFBEB]"} ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}>
            {isPositive ? "↑" : "↓"} {Math.abs(trend)}% vs last month
          </span>
        </div>

        {/* ── Right: icon + sparkline ── */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-base ${isDark ? "bg-[#2D180D] text-[#FBBF24]" : "bg-[#FFFBEB] text-[#78350F]"}`}>
            {icon}
          </div>

          <svg width={W} height={H} style={{ display: "block" }}>
            <polygon points={areaPts} fill={spark} fillOpacity={0.14} />
            <polyline
              points={linePts}
              fill="none"
              stroke={spark}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={coords[coords.length - 1].x.toFixed(1)}
              cy={coords[coords.length - 1].y.toFixed(1)}
              r="2.5"
              fill={spark}
            />
          </svg>
        </div>
      </div>

      {sourceReportId && sourceReportName && (
        <button onClick={(e) => { e.stopPropagation(); router.push(`/reports/${sourceReportId}`); }}
          className={`w-full flex items-center justify-center gap-1 mt-4 pt-3 border-t text-[10.5px] font-bold transition-colors ${isDark ? "border-[#4B2F1C] text-[#D0A966] hover:text-[#FCD34D]" : "border-[#FDE68A] text-[#9B6F3F] hover:text-[#78350F]"}`}>
          <FileText size={11} weight="duotone" />
          <span>Source Report: {sourceReportName}</span>
          <ArrowSquareOut size={10} weight="bold" />
        </button>
      )}
    </div>
  );
}

