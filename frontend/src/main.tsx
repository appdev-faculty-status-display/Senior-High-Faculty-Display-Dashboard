import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from "react-router-dom";
import { applyChartDefaults } from "@/utils/chartConfig";

// Import Chart.js and auto-register all components
import 'chart.js/auto';

// Wait for the Inter font to load
document.fonts.ready.then(() => {
  applyChartDefaults();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
});