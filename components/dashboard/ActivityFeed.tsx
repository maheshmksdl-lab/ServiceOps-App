"use client";
import Avatar from "@mui/material/Avatar";
import { TrendUp, UserPlus, PencilSimple, CheckCircle, CurrencyDollar } from "@phosphor-icons/react";
import { OWNER_AVATARS } from "@/lib/avatars";

type FeedItem = {
  id: number;
  Icon: React.ElementType;
  iconColor: string;
  iconColorDark: string;
  iconBg: string;
  title: string;
  user: string;
  initials: string;
  avatarBg: string;
  ownerKey: string;
  time: string;
};

const feed: FeedItem[] = [
  { id:1, Icon:TrendUp,       iconColor:"#78350F", iconColorDark:"#FBBF24", iconBg:"#FAF2DB", title:"Matrix Corp moved to Negotiation",   user:"PM SDL",  initials:"PM", avatarBg:"#F59E0B", ownerKey:"PM SDL",  time:"5m ago"  },
  { id:2, Icon:UserPlus,      iconColor:"#D97706", iconColorDark:"#FBBF24", iconBg:"#FFF7D6", title:"New lead added: James Wilson",        user:"Sarah K", initials:"SK", avatarBg:"#FBBF24", ownerKey:"Sarah K", time:"23m ago" },
  { id:3, Icon:PencilSimple,  iconColor:"#F59E0B", iconColorDark:"#FBBF24", iconBg:"#FFF7D6", title:"Sweany Inc contact updated",          user:"PM SDL",  initials:"PM", avatarBg:"#F59E0B", ownerKey:"PM SDL",  time:"1h ago"  },
  { id:4, Icon:CheckCircle,   iconColor:"#C2410C", iconColorDark:"#FCD34D", iconBg:"#FFF7D6", title:"Task: Follow up with Apex done",      user:"John D",  initials:"JD", avatarBg:"#D97706", ownerKey:"John D",  time:"2h ago"  },
  { id:5, Icon:CurrencyDollar,iconColor:"#78350F", iconColorDark:"#FCD34D", iconBg:"#FAF2DB", title:"New deal created: Pixel Studios",     user:"Ria M",   initials:"RM", avatarBg:"#78350F", ownerKey:"Ria M",   time:"3h ago"  },
];

export default function ActivityFeed({ isDark = false }: { isDark?: boolean }) {
  return (
    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border h-full flex flex-col backdrop-blur-xl transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "var(--bg-card)" : "#ffffff",
        borderColor: isDark ? "#4B2F1C" : "rgba(245,158,11,0.2)",
        boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.24)" : "0 8px 32px rgba(120,53,15,0.08)",
      }}>
      <div className="mb-4 sm:mb-5">
        <h3 className={`m-0 text-sm sm:text-[14px] font-bold ${isDark ? "text-[#FFF3D6]" : "text-[#78350F]"}`}>Recent Activity</h3>
        <p className={`text-[11px] sm:text-[12px] mt-0.5 ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>Live team updates</p>
      </div>

      <div className="flex-1 space-y-3 sm:space-y-4">
        {feed.map((item, idx) => {
          const { Icon } = item;
          return (
            <div key={item.id} className="flex items-start gap-3 group">
              <div className="relative flex flex-col items-center flex-shrink-0">
                <div className="w-7 h-7 rounded-[9px] flex items-center justify-center" style={{ backgroundColor: isDark ? "#2D180D" : item.iconBg }}>
                  <Icon size={14} color={isDark ? item.iconColorDark : item.iconColor} weight="duotone" />
                </div>
                {idx < feed.length - 1 && (
                  <div className={`w-px flex-1 mt-1 mb-0 h-[14px] ${isDark ? "bg-[#4B2F1C]" : "bg-[#FDE68A]"}`} />
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <p className={`text-xs sm:text-[14px] font-medium leading-snug transition-colors ${isDark ? "text-[#F7E2B2] group-hover:text-[#FFF3D6]" : "text-[#5C3A1E] group-hover:text-[#78350F]"}`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1 flex-wrap">
                  <Avatar
                    src={OWNER_AVATARS[item.ownerKey]}
                    sx={{ width:12, height:12, bgcolor:item.avatarBg, fontSize:"0.42rem", fontWeight:700 }}
                  >
                    {item.initials}
                  </Avatar>
                  <span className={`text-[10px] sm:text-[12px] font-medium ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>{item.user}</span>
                  <span className={`text-[10px] sm:text-[12px] ${isDark ? "text-[#8C6A3F]" : "text-[#D0A966]"}`}>·</span>
                  <span className={`text-[10px] sm:text-[12px] ${isDark ? "text-[#D0A966]" : "text-[#9B6F3F]"}`}>{item.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className={`mt-3 sm:mt-4 w-full text-center text-[10px] sm:text-[11.5px] font-bold py-2 rounded-lg sm:rounded-xl transition-all duration-150 ${isDark ? "text-[#FBBF24] hover:text-[#FFF3D6] hover:bg-[#2D180D]" : "text-[#78350F] hover:text-[#78350F] hover:bg-[#FAF2DB]"}`}>
        View all activity →
      </button>
    </div>
  );
}

