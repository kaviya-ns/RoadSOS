// Emergency contacts 
export const EMERGENCY_CONTACTS = [
  { label: "Ambulance",           number: "108",          color: "#ef4444" },
  { label: "Police",              number: "100",          color: "#3b82f6" },
  { label: "Fire",                number: "101",          color: "#f59e0b" },
  { label: "TN Road Helpline",    number: "1073",         color: "#22c55e" },
  { label: "Women Helpline",      number: "1091",         color: "#a855f7" },
  { label: "Child Helpline",      number: "1098",         color: "#ec4899" },
];

// Facility category config 
export const CATEGORIES = [
  {
    type:        "hospital",
    label:       "Hospitals",
    sublabel:    "Trauma centres & clinics",
    color:       "#ef4444",
    bg:          "rgba(239,68,68,0.12)",
    icon:        "🏥",
  },
  {
    type:        "ambulance_station",
    label:       "Ambulance",
    sublabel:    "Ambulance stations",
    color:       "#f59e0b",
    bg:          "rgba(245,158,11,0.12)",
    icon:        "🚑",
  },
  {
    type:        "police_station",
    label:       "Police",
    sublabel:    "Police stations",
    color:       "#3b82f6",
    bg:          "rgba(59,130,246,0.12)",
    icon:        "🚔",
  },
  {
    type:        "rescue_service",
    label:       "Rescue",
    sublabel:    "Fire & rescue services",
    color:       "#22c55e",
    bg:          "rgba(34,197,94,0.12)",
    icon:        "🚒",
  },
];
