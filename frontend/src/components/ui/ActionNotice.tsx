import { useEffect } from "react";

interface ActionNoticeProps {
  title: string;
  message: string;
  variant?: "success" | "info";
  onDismiss: () => void;
}

const VARIANT_STYLES = {
  success: {
    shell: "border-[#31ac52] bg-[#e6f9ec] text-[#1f6f3b]",
    badge: "bg-[#31ac52] text-white",
  },
  info: {
    shell: "border-[#002f73] bg-[#f8faff] text-[#002f73]",
    badge: "bg-[#002f73] text-white",
  },
} as const;

export default function ActionNotice({
  title,
  message,
  variant = "success",
  onDismiss,
}: ActionNoticeProps) {
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss();
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`mb-4 flex items-start justify-between gap-4 border px-4 py-3 text-sm shadow-sm ${styles.shell}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-6 min-w-6 items-center justify-center px-2 text-[10px] font-bold uppercase tracking-[0.2em] ${styles.badge}`}>
          OK
        </span>
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-base font-bold opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss confirmation"
      >
        ✕
      </button>
    </div>
  );
}