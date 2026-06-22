import { createContext, useContext, useState, useEffect } from "react";

const A11yContext = createContext();

export function A11yProvider({ children }) {
  const [a11y, setA11y] = useState(false);
  const toggle = () => setA11y((v) => !v);

  // apply class + CSS variable overrides on body
  useEffect(() => {
    const root = document.documentElement;
    if (a11y) {
      document.body.classList.add("a11y-mode");
      // override CSS variables to bright mode
      root.style.setProperty("--bg",          "#ffffff");
      root.style.setProperty("--surface",     "#f3f4f6");
      root.style.setProperty("--surface2",    "#e5e7eb");
      root.style.setProperty("--danger", "#cc0000");
      root.style.setProperty("--border",      "#d1d5db");
      root.style.setProperty("--text",        "#111111");
      root.style.setProperty("--text-muted",  "#374151");
      root.style.setProperty("--accent-red",  "#cc0000");
      root.style.setProperty("--accent-blue", "#1d4ed8");
      root.style.setProperty("--accent-green","#15803d");
      root.style.setProperty("--font-size",   "20px");
    } else {
      document.body.classList.remove("a11y-mode");
      // restore dark mode variables
      root.style.setProperty("--bg",          "#0a0f1e");
      root.style.setProperty("--surface",     "#111827");
      root.style.setProperty("--surface2",    "#1a2236");
      root.style.setProperty("--danger", "#dc2626");
      root.style.setProperty("--border",      "#1f2d45");
      root.style.setProperty("--text",        "#f1f5f9");
      root.style.setProperty("--text-muted",  "#64748b");
      root.style.setProperty("--accent-red",  "#ef4444");
      root.style.setProperty("--accent-blue", "#3b82f6");
      root.style.setProperty("--accent-green","#22c55e");
      root.style.removeProperty("--font-size");
    }
  }, [a11y]);

  return (
    <A11yContext.Provider value={{ a11y, toggle }}>
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  return useContext(A11yContext);
}
