import { type Room } from "@/types/requestForm";

export const mockRooms: Room[] = [
  { id: "CR-01", status: "available" },
  { id: "CR-02", status: "available" },
  { id: "CR-03", status: "available" },
];

export const strands: string[] = [
  "ABM",
  "HUMSS",
  "STEM",
];

export const teachers: string[] = [
  "Mr. Robles",
  "Mr. Pagaran",
  "Mr. Legaspi",
  "Mr. Jompilla",
  "Mr. Cataag"
];

export const teacherEmails: Record<string, string> = {
  "Mr. Robles": "roblesky@nu-laguna.edu.ph",
  "Mr. Pagaran": "pagaranag@nu-laguna.edu.ph",
  "Mr. Legaspi": "legaspixx@nu-laguna.edu.ph",
  "Mr. Jompilla": "jompillam@students.nu-laguna.edu.ph",
  "Mr. Cataag": "cataagxx@nu-laguna.edu.ph"
};