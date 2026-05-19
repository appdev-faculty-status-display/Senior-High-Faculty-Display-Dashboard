import { Chart } from 'chart.js';

// Define a type for your chart config (optional but recommended)
type ChartConfig = {
  color?: string;
  fontFamily?: string;
  legendDisplay?: boolean;
};

export function applyChartDefaults(config: ChartConfig = {}) {
  // Apply defaults to the global Chart object
  if (config.fontFamily) {
    Chart.defaults.font.family = config.fontFamily;
  } else {
    Chart.defaults.font.family = "'Inter Variable', sans-serif";
  }

  if (config.color) {
    Chart.defaults.color = config.color;
  } else {
    Chart.defaults.color = '#666666';
  }

  if (config.legendDisplay !== undefined) {
    Chart.defaults.plugins.legend.display = config.legendDisplay;
  } else {
    Chart.defaults.plugins.legend.display = true;
  }
}