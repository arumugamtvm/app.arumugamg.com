import React from "react";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  delay = "0s",
  glow = false,
}) => {
  return (
    <div
      className={`glass-card ${className}`}
      style={{ animationDelay: delay }}
    >
      {glow && <div className="hero-glow" aria-hidden="true" />}
      {children}
    </div>
  );
};
