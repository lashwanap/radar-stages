import { useEffect, useState } from "react";
import { Sun, Moon } from "./Icons.jsx";

const KEY = "radar-stages-theme";
const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches;

// Thème effectif : le choix enregistré, sinon celui de Windows.
function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return systemDark() ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }

  const label = theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre";
  return (
    <button type="button" className="btn btn-ghost theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
