import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter is the single primary typeface across the app. Both class
        // names are kept (callers already use font-heading/font-sans
        // throughout the codebase) but now resolve to the same font so
        // headings and body text both render in Inter, not a silent
        // system-font fallback.
        heading: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      // ── Approved typography scale ──────────────────────────────────
      // Each token bundles font-size + line-height + font-weight so a
      // single utility (e.g. `text-h1`) fully satisfies the design system.
      // Letter-spacing is included where specified (nav-group-label).
      fontSize: {
        // Core scale
        display: ["28px", { lineHeight: "36px", fontWeight: "600" }],
        h1:      ["20px", { lineHeight: "28px", fontWeight: "600" }],
        h2:      ["16px", { lineHeight: "24px", fontWeight: "600" }],
        label:   ["14px", { lineHeight: "20px", fontWeight: "500" }],
        body:    ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        // Dashboard metrics
        "kpi-primary": ["32px", { lineHeight: "36px", fontWeight: "700" }],
        "kpi-label":   ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "kpi-trend":   ["12px", { lineHeight: "16px", fontWeight: "500" }],
        // Navigation
        "nav-item":        ["16px", { lineHeight: "22px", fontWeight: "500" }],
        "nav-group-label": ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.04em" }],
        // Tables
        "table-header":         ["13px", { lineHeight: "18px", fontWeight: "600" }],
        "table-cell":           ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "table-cell-secondary": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        // Forms
        "form-section-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "field-label":        ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "input-text":         ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "helper-text":        ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "error-message":      ["12px", { lineHeight: "16px", fontWeight: "500" }],
        // Buttons
        button:      ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "button-sm": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        // Cards & widgets
        "card-title":    ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "card-content":  ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "card-metadata": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        // Status badges
        "badge-text": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      colors: {
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A5F",
        },
        border: {
          light: "#E3ECFC",
          DEFAULT: "#E5E7EB",
        },
        surface: {
          light: "#EFF6FF",
          DEFAULT: "#f9fbff",
        },
      },
      spacing: {
        "sidebar-expanded": "260px",
        "sidebar-collapsed": "80px",
      },
      animation: {
        "fade-in":  "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "collapse": "collapse 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" },                                "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        collapse: { "0%": { width: "240px" },                             "100%": { width: "80px" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
