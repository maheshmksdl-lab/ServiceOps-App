import type { SxProps, Theme } from "@mui/material/styles";

// Shared MUI X DataGrid theming so every list page (Leads, Deals, Contacts,
// Accounts, Tasks, Reports) looks consistent with the app's existing
// light/dark palette instead of DataGrid's generic defaults.
//
// Light mode follows the reference table style: white body, rounded gray
// header bar, borderless rows, 14px near-black text, orange accents.
export const getDataGridSx = (isDark: boolean): SxProps<Theme> => isDark ? {
  border: "none",
  bgcolor: "#0A0A0A",
  fontFamily: "inherit",

  "& .MuiDataGrid-columnHeaders": {
    bgcolor: "#18181B",
    borderBottom: "1px solid #27272A",
  },
  "& .MuiDataGrid-columnHeader": {
    outline: "none !important",
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: "18px",
  },
  "& .MuiDataGrid-columnSeparator": { display: "none" },

  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid #18181B",
    outline: "none !important",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none !important",
  },

  "& .MuiDataGrid-row": {
    cursor: "pointer",
    "&:hover": { bgcolor: "#0F0F0F" },
    "&.Mui-selected": {
      bgcolor: "#18181B",
      "&:hover": { bgcolor: "#18181B" },
    },
  },

  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid #18181B",
    bgcolor: "#0A0A0A",
  },
  "& .MuiDataGrid-selectedRowCount": {
    fontSize: "11px",
    color: "#737373",
  },
  "& .MuiTablePagination-root": {
    fontSize: "11px",
    color: "#A1A1AA",
  },
  "& .MuiCheckbox-root": {
    color: "#E2E8F0",
  },
  "& .MuiCheckbox-root.Mui-checked, & .MuiCheckbox-root.MuiCheckbox-indeterminate": {
    color: "#1D4ED8",
  },
  "& .MuiDataGrid-virtualScroller": {
    bgcolor: "#0A0A0A",
  },
  "& .MuiDataGrid-overlay": {
    bgcolor: "transparent",
  },
} : {
  border: "none",
  bgcolor: "#FFFFFF",
  fontFamily: "inherit",
  color: "#111111",
  px: 1.5,
  pt: 1.5,
  "--DataGrid-containerBackground": "#F7F7F7",
  "--DataGrid-rowBorderColor": "transparent",

  // Header — rounded gray bar, 14px medium near-black labels
  "& .MuiDataGrid-columnHeaders": {
    border: "none",
  },
  "& .MuiDataGrid-container--top [role=row], & .MuiDataGrid-columnHeaders [role=row]": {
    bgcolor: "#F7F7F7",
    borderRadius: "8px",
    overflow: "hidden",
  },
  "& .MuiDataGrid-columnHeader": {
    bgcolor: "#F7F7F7",
    borderBottom: "none !important",
    outline: "none !important",
    px: 1.5,
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: "20px",
    color: "#111111",
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 500,
  },
  "& .MuiDataGrid-columnSeparator": { display: "none" },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": {
    color: "#111111",
  },
  "& .MuiDataGrid-filler": {
    bgcolor: "#F7F7F7",
  },

  // Body — borderless rows, 14px near-black text
  "& .MuiDataGrid-cell": {
    border: "none",
    outline: "none !important",
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#111111",
    px: 1.5,
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none !important",
  },
  "& .MuiDataGrid-row": {
    cursor: "pointer",
    borderRadius: "8px",
    "&:hover": { bgcolor: "#F7F7F7" },
    "&.Mui-selected": {
      bgcolor: "var(--serviceops-primary-10)",
      "&:hover": { bgcolor: "var(--serviceops-primary-10)" },
    },
  },
  "& .MuiDataGrid-row--borderBottom, & .MuiDataGrid-withBorderColor": {
    borderColor: "transparent",
  },

  // Footer
  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid #E5E5E5",
    bgcolor: "#FFFFFF",
  },
  "& .MuiDataGrid-selectedRowCount": {
    fontSize: "12px",
    color: "#6B6B6B",
  },
  "& .MuiTablePagination-root": {
    fontSize: "12px",
    color: "#3D3D3D",
  },

  "& .MuiCheckbox-root": {
    color: "#B4B4B4",
  },
  "& .MuiCheckbox-root.Mui-checked, & .MuiCheckbox-root.MuiCheckbox-indeterminate": {
    color: "var(--serviceops-primary)",
  },
  "& .MuiDataGrid-virtualScroller": {
    bgcolor: "#FFFFFF",
  },
  "& .MuiDataGrid-overlay": {
    bgcolor: "transparent",
  },
};

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
