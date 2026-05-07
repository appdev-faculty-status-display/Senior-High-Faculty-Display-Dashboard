// frontend/src/utils/pdfExportHelper.ts

/**
 * Opens a new window and builds a print-ready HTML table using DOM APIs
 * (textContent only — no string interpolation of user data, no XSS risk).
 *
 * @param columns 
 * @param rows     
 * @param title    
 * @param subtitle 
 */
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
    body  { font-family: Inter, sans-serif; font-size: 11px; color: #1a1a1a; padding: 32px; }
    h1    { font-size: 16px; font-weight: 800; color: #002f73; margin-bottom: 4px; }
    p     { font-size: 11px; color: #4f4f4f; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr         { background: #002f73; color: white; }
    th, td           { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e8edf5; }
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

/**
 * Clones the app's stylesheets into an iframe, copies a DOM element into it,
 * then triggers the print dialog.
 *
 * @param el    
 * @param title
 */
export function printElement(el: HTMLElement, title: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title></title>
  <style>
    body { font-family: Inter, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; }
    h1   { font-size: 15px; font-weight: 800; color: #002f73; margin-bottom: 4px;
           text-transform: uppercase; letter-spacing: 0.05em; }
    p    { font-size: 10px; color: #4f4f4f; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1 id="pe-title"></h1>
  <p  id="pe-subtitle"></p>
  <div id="pe-content"></div>
</body>
</html>`);
  doc.close();

  // Clone app stylesheets so Tailwind renders correctly
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    doc.head.appendChild(doc.importNode(node, true));
  });

  const titleEl = doc.getElementById("pe-title");
  if (titleEl) titleEl.textContent = title;

  const subtitleEl = doc.getElementById("pe-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `Printed on ${new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })}`;
  }

  const contentEl = doc.getElementById("pe-content");
  if (contentEl) contentEl.appendChild(doc.importNode(el, true));

  iframe.onload = () => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    document.body.removeChild(iframe);
  };
}