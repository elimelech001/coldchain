export const C = {
  bg:       "#F4F6F9",
  panel:    "#FFFFFF",
  panel2:   "#F8FAFC",
  line:     "#E2E8F0",
  ink:      "#0F172A",
  dim:      "#64748B",
  frost:    "#0891B2",
  mint:     "#059669",
  amber:    "#D97706",
  red:      "#DC2626",
  redDeep:  "#FEF2F2",
  blue:     "#2563EB",
};

export const STATUS = {
  healthy:   { c: "#059669", label: "Healthy",   bg: "#F0FDF4", border: "#BBF7D0" },
  warning:   { c: "#D97706", label: "Warning",   bg: "#FFFBEB", border: "#FDE68A" },
  critical:  { c: "#DC2626", label: "Critical",  bg: "#FEF2F2", border: "#FECACA" },
  offline:   { c: "#64748B", label: "Offline",   bg: "#F8FAFC", border: "#E2E8F0" },
  resolving: { c: "#2563EB", label: "Resolving", bg: "#EFF6FF", border: "#BFDBFE" },
};

export const STATUS_ORDER = { critical: 0, warning: 1, offline: 2, healthy: 3, resolving: 4 };

export const EVENT_COLOR = {
  critical:   "#DC2626",
  warning:    "#D97706",
  action:     "#2563EB",
  resolved:   "#059669",
  escalation: "#DC2626",
  info:       "#64748B",
};
