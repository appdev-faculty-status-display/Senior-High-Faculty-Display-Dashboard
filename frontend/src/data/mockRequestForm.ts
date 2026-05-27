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
  "Mr. Robles": "roblesk@students.nu-laguna.edu.ph",
  "Mr. Pagaran": "pagaranag@students.nu-laguna.edu.ph",
  "Mr. Legaspi": "mjlegaspi@nu-laguna.edu.ph",
  "Mr. Jompilla": "jompillam@students.nu-laguna.edu.ph",
  "Mr. Cataag": "cataagjl@students.nu-laguna.edu.ph"
};

export const strandHeadsEmail: Record<string, string> = {
  "ABM": "jompillam@students.nu-laguna.edu.ph",
  "STEM": "roblesk@students.nu-laguna.edu.ph",
  "HUMSS": "pagaranag@students.nu-laguna.edu.ph",
};