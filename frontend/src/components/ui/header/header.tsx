// frontend/src/components/header.tsx
import { cn } from "@/lib/utils";
import nuLogo from "@/assets/logo.svg";

interface HeaderProps {
  variant?: "default" | "admin";
  adminName?: string;
  adminRole?: string;
  onLogout?: () => void;
}

const Header = ({
  variant = "default",
  adminName = "Admin Account",
  adminRole = "SSHS Principal",
  onLogout,
}: HeaderProps) => {
  const isAdmin = variant === "admin";

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={cn(
        "w-full shadow-sm font-[Inter,sans-serif]",
        isAdmin ? "bg-white" : "bg-secondary-active"
      )}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-2">
        {/* ── Logo + Title ── */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0">
            <img src={nuLogo} alt="NU Logo" className="h-full w-full object-contain" />
          </div>
          <div
            className={cn(
              "flex flex-col leading-tight",
              isAdmin ? "text-[#002f73]" : "text-white"
            )}
          >
            <h1 className="font-extrabold tracking-tight text-2xl">NU LAGUNA</h1>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
              {isAdmin ? "SSHS Faculty Board — Admin Panel" : "SSHS Faculty Status Display Board"}
            </p>
          </div>
        </div>

        {/* ── Admin Right Side (only in admin variant) ── */}
        {isAdmin && (
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[#002f73] leading-tight">{adminName}</p>
                <p className="text-xs text-[#4f4f4f] font-medium">{adminRole}</p>
              </div>
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white font-extrabold text-xs border-2 border-[#cbd5e1]"
                style={{ background: "linear-gradient(135deg, #064db6, #002f73)" }}
              >
                {initials}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[#cbd5e1]" />

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors duration-150"
            >
              {/* Logout icon */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ── Accent Bar ── */}
      <div className="relative h-1.5 w-full overflow-hidden">
        <div className="absolute inset-0 flex">
          <div
            className="h-full w-full"
            style={{
              background: isAdmin
                ? "linear-gradient(to right, #ffc107 0%, #ffd41c 20%, #d4a800 40%, #003a8f 70%, #002f73 100%)"
                : "linear-gradient(to right, #ffc107, #ffffff, #ffc107)",
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;