import { type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Header from "@/components/ui/header/header";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type AccessCode = 401 | 403;

interface AccessState {
  code: AccessCode;
  title: string;
  message: string;
}

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: ReactNode;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(globalThis.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readStoredUser(): { role?: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as { role?: string }) : null;
  } catch {
    return null;
  }
}

function getAccessState(allowedRoles: string[]): AccessState | null {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return {
      code: 401,
      title: "Unauthorized",
      message: "Sign in to access the admin routes.",
    };
  }

  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp * 1000 : null;

  if (!payload || !exp || Number.isNaN(exp) || Date.now() >= exp) {
    return {
      code: 403,
      title: "Forbidden",
      message: "Your session has expired. Please sign in again to continue.",
    };
  }

  const user = readStoredUser();
  const role = user?.role?.toLowerCase();

  if (!role || !allowedRoles.map((allowedRole) => allowedRole.toLowerCase()).includes(role)) {
    return {
      code: 403,
      title: "Forbidden",
      message: "You do not have permission to open this admin route.",
    };
  }

  return null;
}

function AccessDeniedScreen({ code, title, message, pathname }: AccessState & { pathname: string }) {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header variant="default" />

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <section className="w-full max-w-5xl overflow-hidden rounded-none bg-white shadow-xl border border-gray-200">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative bg-secondary-active px-8 py-10 text-white lg:px-10">
              <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.24), transparent 55%)" }} />
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="space-y-4">
                  <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase rounded-none tracking-[0.3em] text-white/90">
                    Access blocked
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#ffd41c]">
                      {code}
                    </p>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                      {title}
                    </h1>
                  </div>
                  <p className="max-w-md text-sm leading-6 text-white/85 sm:text-base">
                    {message}
                  </p>
                </div>

                <div className="grid gap-3 rounded-none border border-white/15 bg-white/10 p-4 text-sm text-white/90 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">Required route</p>
                    <p className="mt-1 font-medium break-all">{pathname}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/60">Next step</p>
                    <p className="mt-1 font-medium">Use the admin login page to continue.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center px-8 py-10 sm:px-10">
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#064db6]">
                    Session check
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-secondary">
                    {code === 401 ? "Sign in required" : "Access denied"}
                  </h2>
                  <p className="text-sm leading-6 text-gray-600">
                    {code === 401
                      ? "You need an active principal session before opening this section."
                      : "Your current session is no longer valid or does not have permission for this page."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center justify-center rounded-none bg-[#ffd41c] px-5 py-3 text-sm font-bold text-secondary shadow-sm transition hover:bg-[#f0c800]"
                  >
                    Go to admin login
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-none border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-[#002f73] transition hover:border-[#064db6] hover:bg-[#f8faff]"
                  >
                    Return to faculty board
                  </Link>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-[#f8faff] p-4 text-sm text-gray-600">
                  <p className="font-semibold text-[#002f73]">What happened</p>
                  <p className="mt-1 leading-6">
                    The route was protected because the session is missing, expired, or the account role is not allowed here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ProtectedRoute({ allowedRoles = ["admin"], children }: ProtectedRouteProps) {
  const location = useLocation();
  const accessState = getAccessState(allowedRoles);

  if (accessState) {
    return <AccessDeniedScreen {...accessState} pathname={location.pathname} />;
  }

  return <>{children ?? <Outlet />}</>;
}