"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Thermometer,
  Zap,
  Settings,
  ChevronRight,
  Cpu,
} from "lucide-react";

const navItems = [
  { id: "overview",  label: "Overview",    Icon: LayoutDashboard },
  { id: "climate",   label: "Climate",     Icon: Thermometer },
  { id: "devices",   label: "Devices",     Icon: Zap },
  { id: "settings",  label: "Settings",    Icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`sidebar ${expanded ? "expanded" : ""} glass flex-shrink-0 flex flex-col h-screen sticky top-0 z-40`}
      style={{ borderRight: "1px solid var(--border)", borderRadius: 0 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 mb-2 overflow-hidden">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}>
          <Cpu size={18} color="white" />
        </div>
        <span className="font-display font-bold text-base text-white whitespace-nowrap opacity-0 transition-opacity duration-200"
              style={{ opacity: expanded ? 1 : 0 }}>
          EcoNode
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map(({ id, label, Icon }) => (
          <div
            key={id}
            className={`nav-item ${activeTab === id ? "active" : ""}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-200"
                  style={{ opacity: expanded ? 1 : 0 }}>
              {label}
            </span>
            {activeTab === id && expanded && (
              <ChevronRight size={14} className="ml-auto opacity-50" />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom node info */}
      <div className="px-4 py-4 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 h-2 w-2 rounded-full pulse-dot" style={{ background: "var(--success)" }} />
          <span className="text-xs text-slate-500 whitespace-nowrap" style={{ opacity: expanded ? 1 : 0 }}>
            EN-001 · Online
          </span>
        </div>
      </div>
    </aside>
  );
}
