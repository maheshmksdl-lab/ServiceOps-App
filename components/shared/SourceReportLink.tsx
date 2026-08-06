"use client";
import { useRouter } from "next/navigation";
import { FileText, ArrowSquareOut } from "@phosphor-icons/react";

interface SourceReportLinkProps {
  reportId: string;
  reportName: string;
  isDark?: boolean;
  className?: string;
}

/**
 * Inline footer link shown on Dashboard widgets to clarify that the widget's
 * data originates from a Report — clicking opens that report's detail page.
 */
export default function SourceReportLink({ reportId, reportName, isDark = false, className = "" }: SourceReportLinkProps) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(`/reports/${reportId}`)}
      className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 border-t text-[11px] font-semibold transition-colors ${isDark ? "border-[#4B2F1C] text-[#D0A966] hover:text-[#FCD34D] hover:bg-[#2D180D]" : "border-[#FDE68A] text-[#9B6F3F] hover:text-[#78350F] hover:bg-[#FAF2DB]"} ${className}`}>
      <FileText size={12} weight="duotone" />
      <span>Source Report: {reportName}</span>
      <ArrowSquareOut size={11} weight="bold" />
    </button>
  );
}
