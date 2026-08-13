"use client";
import { useTheme } from "@/components/ThemeContext";

/**
 * Outlined-field styling shared by the Create Job and Edit Job drawers so the
 * two forms stay visually identical as either one changes.
 */
export function useJobFieldSx() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: isDark ? "#0A0A0A" : "#fff",
      fontSize: "0.84rem",
      "& fieldset":             { borderColor: isDark ? "#27272A" : "var(--serviceops-soft)", borderWidth: 1.5 },
      "&:hover fieldset":       { borderColor: "var(--serviceops-primary)" },
      "&.Mui-focused fieldset": { borderColor: "var(--serviceops-primary)", borderWidth: 1.5 },
      "&.Mui-error fieldset":   { borderColor: "#EF4444" },
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.84rem",
      color: isDark ? "#A1A1AA" : "#94A3B8",
      "&.Mui-focused": { color: "var(--serviceops-primary)" },
      "&.Mui-error":   { color: "#EF4444" },
    },
    "& input, & textarea":       { color: isDark ? "#D4D4D8" : "#1F2937" },
    "& .MuiSelect-select":       { fontSize: "0.84rem", color: isDark ? "#D4D4D8" : "#1F2937" },
    "& .MuiFormHelperText-root": { fontSize: "0.71rem", marginLeft: "2px" },
  } as const;
}
