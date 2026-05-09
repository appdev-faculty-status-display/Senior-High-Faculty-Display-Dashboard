// frontend/src/utils/chartConfig.ts
import { defaults, Chart } from "chart.js";

export function applyChartDefaults(): void {
  const apply = () => {
    defaults.font.family = "Inter, sans-serif";
    defaults.font.size   = 11;
    defaults.color       = "#4f4f4f";
  };

  // Phase 1 — immediate
  apply();

  // Phase 2 — after Inter is confirmed loaded, force all charts to redraw
  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      apply();
      // Chart.instances is a { id: Chart } map (Chart.js v3+)
      Object.values(Chart.instances).forEach((chart) => chart.update());
    });
  }
}