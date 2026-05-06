// frontend/src/utils/chartConfig.ts
import { defaults } from "chart.js";

export function applyChartDefaults(): void {
  defaults.font.family = "Inter, sans-serif";
  defaults.font.size   = 11;
  defaults.color       = "#4f4f4f";
}