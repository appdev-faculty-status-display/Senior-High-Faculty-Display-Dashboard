function fmt(hour: number, min: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMin = min.toString().padStart(2, "0");
  return `${displayHour}:${displayMin} ${period}`;
}

export function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const nextM = m + 15;
      const nextH = nextM === 60 ? h + 1 : h;
      const normNextM = nextM === 60 ? 0 : nextM;
      if (nextH > endHour) break;
      slots.push(`${fmt(h, m)} – ${fmt(nextH, normNextM)}`);
    }
  }
  return slots;
}