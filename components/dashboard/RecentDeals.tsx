"use client";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { ArrowSquareOut, TrendUp, TrendDown, Minus } from "@phosphor-icons/react";
import { OWNER_AVATARS } from "@/lib/avatars";
import SourceReportLink from "@/components/shared/SourceReportLink";

type Deal = {
  id: string; name: string; amount: number;
  stage: string; stageBg: string; stageFg: string;
  owner: string; initials: string; avatarBg: string;
  closeDate: string; change: "up" | "same" | "down";
};

const deals: Deal[] = [
  { id:"CRM-2026-0013", name:"Sweany Inc",     amount:29999,  stage:"Qualification",  stageBg:"#FAF2DB", stageFg:"#78350F", owner:"PM SDL",   initials:"PM", avatarBg:"#F59E0B", closeDate:"15 May", change:"same" },
  { id:"CRM-2026-0012", name:"TechFlow Ltd",   amount:85000,  stage:"Proposal",       stageBg:"#FFF7D6", stageFg:"#78350F", owner:"Sarah K",  initials:"SK", avatarBg:"#FBBF24", closeDate:"12 May", change:"up"   },
  { id:"CRM-2026-0011", name:"Apex Solutions", amount:42500,  stage:"Needs Analysis", stageBg:"#FAF2DB", stageFg:"#78350F", owner:"John D",   initials:"JD", avatarBg:"#D97706", closeDate:"10 May", change:"up"   },
  { id:"CRM-2026-0010", name:"Matrix Corp",    amount:120000, stage:"Negotiation",    stageBg:"#FFF7D6", stageFg:"#78350F", owner:"PM SDL",   initials:"PM", avatarBg:"#F59E0B", closeDate:"08 May", change:"up"   },
  { id:"CRM-2026-0009", name:"Pixel Studios",  amount:18750,  stage:"Qualification",  stageBg:"#FAF2DB", stageFg:"#78350F", owner:"Ria M",    initials:"RM", avatarBg:"#78350F", closeDate:"05 May", change:"down" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function RecentDeals({ isDark = false }: { isDark?: boolean }) {
  const cellSx = {
    borderBottom: `1px solid ${isDark ? "#4B2F1C" : "#FDE68A"}`,
    py: "14px",
    backgroundColor: isDark ? "#21160D" : "#FFFBEB",
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border overflow-hidden backdrop-blur-xl transition-colors duration-300"
      style={{
        backgroundColor: "#ffffff",
        borderColor: isDark ? "#4B2F1C" : "rgba(245,158,11,0.2)",
        boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.24)" : "0 8px 32px rgba(120,53,15,0.08)",
      }}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-b ${isDark ? "border-[#4B2F1C]" : "border-[#FDE68A]"}`}
        style={{ backgroundColor: "#ffffff" }}>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <h3 className={`text-sm sm:text-[14px] font-bold leading-none m-0 ${isDark ? "text-[#FFF3D6]" : "text-[#78350F]"}`}>Recent Deals</h3>
          <span className={`text-[11px] sm:text-[12px] leading-none ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>· 5 latest active deals</span>
        </div>
        <Button
          size="small"
          endIcon={<ArrowSquareOut size={12} weight="duotone" />}
          sx={{ textTransform:"none", fontSize:"0.7rem", color: isDark ? "#FBBF24" : "#78350F", fontWeight:700, borderRadius:"8px", "&:hover":{ bgcolor: isDark ? "rgba(251,191,36,0.12)" : "rgba(245,158,11,0.12)" } }}
        >
          View All
        </Button>
      </div>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Deal", "Amount", "Stage", "Owner", "Close Date"].map(h => (
                <TableCell key={h} sx={{ backgroundColor: isDark ? "#21160D" : "#FAF2DB", color: isDark ? "#D0A966" : "#78350F", borderBottom: `1px solid ${isDark ? "#4B2F1C" : "#FDE68A"}`, fontWeight: 700, fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {deals.map(deal => (
              <TableRow key={deal.id} hover sx={{ "&:hover td":{ bgcolor: isDark ? "rgba(251,191,36,0.08)" : "rgba(245,158,11,0.06)" }, cursor:"pointer", "& td": cellSx }}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-[13px] h-[13px] flex items-center justify-center flex-shrink-0">
                      {deal.change === "up" && <TrendUp size={13} color="#10B981" weight="duotone" />}
                      {deal.change === "down" && <TrendDown size={13} color="#EF4444" weight="duotone" />}
                      {deal.change === "same" && <Minus size={11} color="#94A3B8" weight="bold" />}
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <p className={`text-[14px] font-semibold leading-tight ${isDark ? "text-[#FFF3D6]" : "text-[#5C3A1E]"}`}>{deal.name}</p>
                      <p className={`text-[12px] font-mono ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>{deal.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-[14px] font-bold ${isDark ? "text-[#FFF3D6]" : "text-[#5C3A1E]"}`}>{fmt(deal.amount)}</span>
                </TableCell>
                <TableCell>
                  <Chip label={deal.stage} size="small" sx={{ bgcolor: isDark ? "rgba(39,39,42,0.8)" : deal.stageBg, color: isDark ? "#A1A1AA" : deal.stageFg, fontWeight:700, fontSize:"0.65rem", height:20, borderRadius:"5px" }} />
                </TableCell>
                <TableCell>
                  <Tooltip title={deal.owner}>
                    <div className="flex items-center gap-1.5">
                      <Avatar
                        src={OWNER_AVATARS[deal.owner]}
                        sx={{ width:22, height:22, bgcolor:deal.avatarBg, fontSize:"0.58rem", fontWeight:700 }}
                      >
                        {deal.initials}
                      </Avatar>
                      <span className={`text-[11.5px] font-medium ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>{deal.owner}</span>
                    </div>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <span className={`text-[12px] font-medium ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>{deal.closeDate}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <SourceReportLink reportId="r1" reportName="Deal 30" isDark={isDark} className="rounded-b-2xl" />
    </div>
  );
}

