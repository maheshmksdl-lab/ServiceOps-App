"use client";
import { useState, useRef, useEffect } from "react";
import Badge from "@mui/material/Badge";
import InputBase from "@mui/material/InputBase";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import { MagnifyingGlass, Bell, Command, Sun, Moon, List, User, SignOut } from "@phosphor-icons/react";
import { OWNER_AVATARS } from "@/lib/avatars";
import { useTheme } from "@/components/ThemeContext";
import { useSidebar } from "@/components/SidebarContext";
import { useRouter } from "next/navigation";

export default function TopBar({ title }: { title?: string }) {
  const [search,      setSearch]      = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const { openMobile } = useSidebar();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    document.cookie = "crm_auth=; path=/; max-age=0";
    localStorage.removeItem("crm_auth");
    router.push("/login");
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className={`sticky top-0 z-40 border-b px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 lg:py-6 h-auto flex items-center gap-2 sm:gap-3 lg:gap-8 transition-colors duration-300 ${isDark ? "bg-[var(--bg-topbar)] border-[var(--border-soft)]" : "bg-[var(--serviceops-surface)] border-[var(--serviceops-soft)]"}`}>

      {/* Mobile hamburger - hidden on desktop */}
      <button
        onClick={openMobile}
        className={`lg:hidden flex-shrink-0 w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center rounded-lg transition-all ${isDark ? "text-[var(--serviceops-secondary)] hover:text-[var(--serviceops-primary)] hover:bg-[var(--serviceops-tint)]" : "text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-tint)]"}`}
        aria-label="Open navigation"
      >
        <List size={18} weight="bold" />
      </button>

      {/* Left - page title / date */}
      <div className="flex-1 min-w-0">
        {title ? (
          <div className="flex items-baseline gap-2 whitespace-nowrap">
            <h1 className={`text-base sm:text-h1 tracking-tight m-0 ${isDark ? "text-[var(--serviceops-depth)]" : "text-[var(--serviceops-depth)]"}`}>{title}</h1>
            <span className="hidden sm:inline text-[10px] sm:text-caption text-slate-400">&middot; {today}</span>
          </div>
        ) : (
          <p className="m-0 hidden sm:block text-caption text-slate-400 whitespace-nowrap">{today}</p>
        )}
      </div>

      {/* Search - hidden on mobile, visible md+ */}
      <div className={`hidden md:flex items-center gap-2 border rounded-xl px-2.5 sm:px-3 py-1.5 w-56 lg:w-60 group transition-all ${isDark ? "bg-[var(--serviceops-surface)] border-[var(--serviceops-soft)] focus-within:border-[var(--serviceops-primary)] focus-within:border-2 focus-within:shadow-[0_0_0_2px_var(--serviceops-soft)]" : "bg-[var(--serviceops-surface)] border-[var(--serviceops-soft)] focus-within:border-[var(--serviceops-primary)] focus-within:border-2 focus-within:shadow-[0_0_0_2px_var(--serviceops-soft)]"}`}>
        <MagnifyingGlass size={14} color={isDark ? "#9CA3AF" : "#737373"} weight="duotone" />
        <InputBase
          placeholder="Search leads, deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flex: 1,
            fontSize: "0.8rem",
            color: isDark ? "#D4D4D8" : "#334155",
            "& input::placeholder": { color: "#94A3B8", opacity: 1 },
          }}
        />
        <Tooltip title="Cmd+K">
          <Command size={12} color="#E2E8F0" weight="duotone" />
        </Tooltip>
      </div>

      {/* Dark / Light toggle */}
      <Tooltip title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}>
        <IconButton
          onClick={toggle}
          size="small"
          sx={{
            borderRadius: "8px",
            border: `1.5px solid ${isDark ? "var(--serviceops-soft)" : "var(--serviceops-soft)"}`,
            bgcolor: isDark ? "var(--serviceops-surface)" : "var(--serviceops-surface)",
            "&:hover": { bgcolor: isDark ? "var(--serviceops-tint)" : "var(--serviceops-tint)" },
            transition: "all 0.2s ease",
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            padding: 0.5,
          }}
        >
          {isDark
            ? <Sun size={16} color="#FBBF24" weight="duotone" />
            : <Moon size={16} color="#64748B" weight="duotone" />
          }
        </IconButton>
      </Tooltip>

      {/* Notifications - hidden on mobile */}
      <Tooltip title="3 unread notifications">
        <IconButton size="small" sx={{ borderRadius: "8px", "&:hover": { bgcolor: isDark ? "var(--serviceops-tint)" : "var(--serviceops-tint)" }, display: { xs: "none", sm: "inline-flex" } }}>
          <Badge
            badgeContent={3}
            color="error"
            sx={{ "& .MuiBadge-badge": { fontSize: "0.58rem", height: 15, minWidth: 15, padding: "0 3px" } }}
          >
            <Bell size={18} color={isDark ? "#9CA3AF" : "#64748B"} weight="duotone" />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Avatar + dropdown */}
      <div ref={profileRef} className="relative flex-shrink-0">
        <Avatar
          src={OWNER_AVATARS["PM SDL"]}
          onClick={() => setProfileOpen(p => !p)}
          sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: isDark ? "var(--serviceops-tint)" : "var(--serviceops-tint)", fontSize: "0.55rem", fontWeight: 800, cursor: "pointer" }}
          className={`ring-2 transition-all ${profileOpen ? (isDark ? "ring-[#D4D4D8]" : "ring-[#4A7AE8]") : "ring-transparent"} ${isDark ? "hover:ring-[#D4D4D8]" : "hover:ring-[#4A7AE8]"}`}
        >
          PM
        </Avatar>

        {profileOpen && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl overflow-hidden z-50"
            style={{
              background: isDark ? "var(--serviceops-surface)" : "#ffffff",
              border: `1px solid ${isDark ? "var(--serviceops-soft)" : "var(--serviceops-soft)"}`,
              boxShadow: isDark
                ? "0 16px 40px rgba(0,0,0,0.6)"
                : "0 16px 40px rgba(29,78,216,0.12), 0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            {/* Profile info */}
            <div className={`px-4 py-3 border-b ${isDark ? "border-[var(--serviceops-soft)]" : "border-[var(--serviceops-soft)]"}`}>
              <p className={`m-0 text-label ${isDark ? "text-[#F4F4F5]" : "text-slate-800"}`}>PM SDL</p>
              <p className={`m-0 text-caption mt-0.5 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>Super Admin</p>
            </div>

            {/* My Account */}
            <button
              onClick={() => { setProfileOpen(false); router.push("/settings"); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-button transition-colors ${
                isDark ? "text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-tint)]" : "text-[var(--serviceops-depth)] hover:bg-[var(--serviceops-tint)]"
              }`}
            >
              <User size={15} weight="duotone" className={isDark ? "text-[#71717A]" : "text-slate-400"} />
              My Account
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-button transition-colors border-t ${
                isDark
                  ? "text-red-400 hover:bg-[var(--serviceops-tint)] border-[var(--serviceops-soft)]"
                  : "text-red-500 hover:bg-red-50 border-[var(--serviceops-soft)]"
              }`}
            >
              <SignOut size={15} weight="duotone" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
