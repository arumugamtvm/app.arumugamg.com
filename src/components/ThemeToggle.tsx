import React from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import type { ThemePreference } from "../hooks/useTheme";

interface ThemeToggleProps {
  preference: ThemePreference;
  onCycle: () => void;
}

const LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ preference, onCycle }) => {
  const Icon = preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs theme-toggle"
      onClick={onCycle}
      aria-label={`Theme: ${LABELS[preference]}. Click to change.`}
      title={`Theme: ${LABELS[preference]}`}
    >
      <Icon size={14} />
      <span className="theme-toggle-label">{LABELS[preference]}</span>
    </button>
  );
};
