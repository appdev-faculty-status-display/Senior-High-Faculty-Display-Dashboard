import logo from "@/assets/logo.svg";
import { useState, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  children?: NavItem[];
};

type ActiveNav = string;

// ─── Nav Data ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: "faculty-activity",
    label: "Faculty Activity",
  },
  {
    id: "consultation",
    label: "Consultation",
  },
  {
    id: "resource-communication",
    label: "Resource & Communication",
  },
  {
    id: "add-announcement",
    label: "Add Announcement",
  },
  {
    id: "add-schedule",
    label: "Add Schedule",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// NU Shield Logo
function NULogo() {
  return (
    <img 
      src={logo} 
      alt="NU Logo" 
      className="w-[36px] h-[36px] flex-shrink-0 rounded-md object-contain" 
    />
  );
}

interface AdminAvatarProps {
  name: string;
  role: string;
}

function AdminAvatar({ name, role }: AdminAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-black text-[#002f73] leading-tight">{name}</p>
        <p className="text-xs text-[#4f4f4f] font-medium">{role}</p>
      </div>
      {/* Replace with actual avatar image: <img src="/admin-avatar.png" className="w-9 h-9 rounded-full object-cover border-2 border-[#cbd5e1]" /> */}
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2"
        style={{ borderColor: "#cbd5e1" }}
      >
        <div
          className="w-full h-full flex items-center justify-center text-white font-black text-xs"
          style={{ background: "linear-gradient(135deg, #064db6, #002f73)" }}
        >
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
      </div>
    </div>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  active: ActiveNav;
  onSelect: (id: string) => void;
  depth?: number;
}

function SidebarNavItem({ item, active, onSelect, depth = 0 }: SidebarNavItemProps) {
  const isActive = active === item.id;

  return (
    <>
      <button
        onClick={() => onSelect(item.id)}
        className={`
          w-full text-left transition-all duration-150 select-none
          ${depth === 0 ? "px-4 py-3" : "px-6 py-2.5"}
          ${isActive
            ? "font-black text-white"
            : "font-bold text-[#1a1a1a] hover:bg-[#f0f4ff] hover:text-[#064db6]"
          }
        `}
        style={isActive ? { background: "#002f73" } : {}}
      >
        <span className={`${depth === 0 ? "text-sm" : "text-xs"} leading-snug`}>
          {item.label}
        </span>
      </button>

      {item.children?.map((child) => (
        <SidebarNavItem
          key={child.id}
          item={child}
          active={active}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

interface MainContentProps {
  activeNav: ActiveNav;
}

function MainContent({ activeNav }: MainContentProps) {
  // Each nav section renders its own content area.
  // Content is empty per the mockup — ready for your team to fill in.
  const contentMap: Record<string, ReactNode> = {
    "faculty-activity": (
      <div className="w-full h-full flex items-start justify-start">
        {/* Faculty Activity content goes here */}
      </div>
    ),
    "consultation": (
      <div className="w-full h-full flex items-start justify-start">
        {/* Consultation content goes here */}
      </div>
    ),
    "resource-communication": (
      <div className="w-full h-full flex items-start justify-start">
        {/* Resource & Communication content goes here */}
      </div>
    ),
  };

  return (
    <div className="flex-1 min-h-0 bg-white">
      {contentMap[activeNav] ?? null}
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<ActiveNav>("faculty-activity");

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-[#cbd5e1]">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2">
          <NULogo />
          <div>
            <h1
              className="text-base font-black leading-tight tracking-wide"
              style={{ color: "#002f73" }}
            >
              NU LAGUNA
            </h1>
            <p
              className="text-[11px] font-bold tracking-widest uppercase leading-none"
              style={{ color: "#064db6" }}
            >
              SSHS Faculty Board
            </p>
          </div>
        </div>

        {/* Right: Admin info */}
        <AdminAvatar name="Admin Account" role="SSHS Principal" />
      </header>

      {/* ── Accent Bar: gold → blue gradient ── */}
      <div
        className="h-2 w-full flex-shrink-0"
        style={{
          background: "linear-gradient(to right, #ffc107 0%, #ffd41c 20%, #d4a800 40%, #003a8f 70%, #002f73 100%)",
        }}
      />

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          className="flex-shrink-0 flex flex-col bg-white border-r border-[#cbd5e1]"
          style={{ width: "160px" }}
        >
          <nav className="flex flex-col pt-4">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                active={activeNav}
                onSelect={setActiveNav}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white">
          <MainContent activeNav={activeNav} />
        </main>

      </div>
    </div>
  );
}