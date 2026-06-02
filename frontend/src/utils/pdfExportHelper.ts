// frontend/src/utils/pdfExportHelper.ts

function copyStyles(sourceDoc: Document, targetDoc: Document): void {
  sourceDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    targetDoc.head.appendChild(node.cloneNode(true));
  });
}

function convertCanvasesToImages(root: HTMLElement): void {
  root.querySelectorAll("canvas").forEach((canvas) => {
    try {
      const image = document.createElement("img");
      image.src = canvas.toDataURL("image/png");
      image.alt = canvas.getAttribute("aria-label") ?? "Chart image";
      image.style.width = `${canvas.width}px`;
      image.style.height = `${canvas.height}px`;
      image.style.maxWidth = "100%";
      canvas.replaceWith(image);
    } catch {
      // If a chart canvas cannot be serialized, keep the original element.
    }
  });
}

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
  const win = window.open("", "_blank");
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Inter Variable, sans-serif; color: #1a1a1a; }
    h1   { font-size: 13px; font-weight: 800; color: #002f73; margin-bottom: 2px; }
    p    { font-size: 9px; color: #4f4f4f; margin-bottom: 8px; }
    #print-root { width: 100%; }
    img  { max-width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <h1 id="pe-title"></h1>
  <p  id="pe-subtitle"></p>
  <div id="print-root"></div>
</body>
</html>`);
  doc.close();

  copyStyles(document, doc);

  const titleEl = doc.getElementById("pe-title");
  if (titleEl) titleEl.textContent = title;

  const subtitleEl = doc.getElementById("pe-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `Printed on ${new Date().toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    })}`;
  }

  const printRoot = doc.getElementById("print-root");
  if (printRoot) {
    const clone = el.cloneNode(true) as HTMLElement;
    convertCanvasesToImages(clone);
    printRoot.appendChild(clone);
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 0);
  });

  win.focus();
  win.print();
  win.close();
}