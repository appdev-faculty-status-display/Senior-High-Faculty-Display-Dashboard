// frontend/src/utils/pdfExportHelper.ts
import html2canvas from "html2canvas";

export function exportTablePDF(
  columns: string[],
  rows: string[][],
  title: string,
  subtitle?: string
): void {
  const win = window.open("", "_blank");
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title></title>
  <style>
    @page { margin: 20mm; }
    * { box-sizing: border-box; }
    body  { font-family: Inter Variable, sans-serif; font-size: 11px; color: #1a1a1a; }
    h1    { font-size: 15px; font-weight: 800; color: #002f73; margin-bottom: 4px; }
    p     { font-size: 10px; color: #4f4f4f; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #002f73; color: white; }
    th, td   { text-align: left; padding: 7px 10px; border-bottom: 1px solid #e8edf5; font-size: 10px; }
    tbody tr:nth-child(even) { background: #f8faff; }
  </style>
</head>
<body>
  <h1 id="pdf-title"></h1>
  <p  id="pdf-subtitle"></p>
  <table>
    <thead><tr id="pdf-thead"></tr></thead>
    <tbody id="pdf-tbody"></tbody>
  </table>
</body>
</html>`);
  doc.close();

  const titleEl = doc.getElementById("pdf-title");
  if (titleEl) titleEl.textContent = title;

  const subtitleEl = doc.getElementById("pdf-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = subtitle ??
      `Exported on ${new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })}`;
  }

  const thead = doc.getElementById("pdf-thead");
  if (thead) {
    columns.forEach((col) => {
      const th = doc.createElement("th");
      th.textContent = col;
      thead.appendChild(th);
    });
  }

  const tbody = doc.getElementById("pdf-tbody");
  if (tbody) {
    rows.forEach((rowData) => {
      const tr = doc.createElement("tr");
      rowData.forEach((value) => {
        const td = doc.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  win.focus();
  win.print();
}

export async function printElement(el: HTMLElement, title: string): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");

  const win = window.open("", "_blank");
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title></title>
  <style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family:  Variab;e, sans-serif; color: #1a1a1a; }
    h1   { font-size: 13px; font-weight: 800; color: #002f73; margin-bottom: 2px; }
    p    { font-size: 9px; color: #4f4f4f; margin-bottom: 8px; }
    img  { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <h1 id="pe-title"></h1>
  <p  id="pe-subtitle"></p>
  <img id="pe-img" />
</body>
</html>`);
  doc.close();

  const titleEl = doc.getElementById("pe-title");
  if (titleEl) titleEl.textContent = title;

  const subtitleEl = doc.getElementById("pe-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `Printed on ${new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })}`;
  }

  const imgEl = doc.getElementById("pe-img") as HTMLImageElement;
  if (imgEl) {
    imgEl.src = imgData;
    imgEl.onload = () => { win.focus(); win.print(); };
  }
}