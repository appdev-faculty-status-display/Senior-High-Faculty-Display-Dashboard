import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);

  // Guard against invalid dates
  if (isNaN(date.getTime())) {
    return isoString; // fallback: just show the raw string
  }

  return date
    .toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "")
    .replace("AM", "am")
    .replace("PM", "pm");
}