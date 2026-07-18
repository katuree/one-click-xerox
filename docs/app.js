const fileInput = document.querySelector('#file');
const cleanBtn = document.querySelector('#cleanBtn');
const modeInput = document.querySelector('#mode');
const formatInput = document.querySelector('#format');
const statusEl = document.querySelector('#status');
const originalPreview = document.querySelector('#originalPreview');
const cleanPreview = document.querySelector('#cleanPreview');
const downloadLink = document.querySelector('#downloadLink');
const printBtn = document.querySelector('#printBtn');
const printDialog = document.querySelector('#printDialog');
const closePrintBtn = document.querySelector('#closePrintBtn');
const confirmPrintBtn = document.querySelector('#confirmPrintBtn');
const paperSizeInput = document.querySelector('#paperSize');
const orientationInput = document.querySelector('#orientation');
const fitModeInput = document.querySelector('#fitMode');
const copiesInput = document.querySelector('#copies');
const copiesPerPageInput = document.querySelector('#copiesPerPage');
const pageRangeInput = document.querySelector('#pageRange');
const customPageRangeInput = document.querySelector('#customPageRange');
const colorModeInput = document.querySelector('#colorMode');
const marginModeInput = document.querySelector('#marginMode');
const scaleModeInput = document.querySelector('#scaleMode');
const scalePercentInput = document.querySelector('#scalePercent');
const includeBackgroundInput = document.querySelector('#includeBackground');
const offsetXInput = document.querySelector('#offsetX');
const offsetYInput = document.querySelector('#offsetY');
const resetPositionBtn = document.querySelector('#resetPositionBtn');
const printGapInput = document.querySelector('#printGap');
const showCutLinesInput = document.querySelector('#showCutLines');
const paperInfo = document.querySelector('#paperInfo');
const pageCount = document.querySelector('#pageCount');
const printPreviewPages = document.querySelector('#printPreviewPages');
const printImage = document.querySelector('#printImage');
const printPages = document.querySelector('#printPages');

const paperSizes = {
  a3: { label: 'A3', portrait: [297, 420], landscape: [420, 297] },
  a4: { label: 'A4', portrait: [210, 297], landscape: [297, 210] },
  a5: { label: 'A5', portrait: [148, 210], landscape: [210, 148] },
  letter: { label: 'Letter', portrait: [216, 279], landscape: [279, 216] },
  legal: { label: 'Legal', portrait: [216, 356], landscape: [356, 216] },
  'photo-4x6': { label: 'Photo 4×6', portrait: [102, 152], landscape: [152, 102] },
  'photo-5x7': { label: 'Photo 5×7', portrait: [127, 178], landscape: [178, 127] },
  'id-card': { label: 'ID Card', portrait: [54, 86], landscape: [86, 54] },
  passport: { label: 'Passport Photo', portrait: [35, 45], landscape: [45, 35] },
};

const printLayouts = {
  1: [1, 1],
  2: [2, 1],
  4: [2, 2],
  6: [3, 2],
  8: [4, 2],
  9: [3, 3],
};

let selectedFile = null;
let lastObjectUrl = null;

function setStatus(message) { statusEl.textContent = message; }

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function syncCopiesWithLayout() {
  const copiesPerPage = clampNumber(copiesPerPageInput.value, 1, 9);
  const copies = clampNumber(copiesInput.value, 1, 100);
  if (copies < copiesPerPage) copiesInput.value = copiesPerPage;
}

function createPrintTile(imageUrl) {
  const tile = document.createElement('div');
  tile.className = 'print-tile';
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = 'Cleaned document copy';
  tile.appendChild(image);
  return tile;
}

function createPrintPage(imageUrl, count, preview = false, pageNumber = 1) {
  const page = document.createElement('div');
  const copiesPerPage = clampNumber(copiesPerPageInput.value, 1, 9);
  const [cols, rows] = printLayouts[copiesPerPage] || printLayouts[1];

  page.className = preview ? 'print-preview-page' : 'print-page';
  page.dataset.pageNumber = String(pageNumber);
  page.style.setProperty('--copies-per-page', String(copiesPerPage));
  page.style.setProperty('--print-cols', String(cols));
  page.style.setProperty('--print-rows', String(rows));
  page.style.setProperty('--print-gap', `${printGapInput.value}mm`);
  page.classList.toggle('with-cut-lines', showCutLinesInput.checked);

  for (let i = 0; i < count; i += 1) page.appendChild(createPrintTile(imageUrl));
  return page;
}

function selectedPageNumbers(totalPages) {
  if (pageRangeInput.value === 'first') return new Set([1]);
  if (pageRangeInput.value !== 'custom') return null;

  const pages = new Set();
  customPageRangeInput.value.split(',').map(part => part.trim()).filter(Boolean).forEach(part => {
    const [startRaw, endRaw] = part.split('-').map(value => clampNumber(value, 1, totalPages));
    const start = Math.min(startRaw, endRaw || startRaw);
    const end = Math.max(startRaw, endRaw || startRaw);
    for (let page = start; page <= end; page += 1) pages.add(page);
  });
  return pages.size ? pages : null;
}

function buildPrintPages(target, preview = false) {
  if (!lastObjectUrl) return 0;
  const copies = clampNumber(copiesInput.value, 1, 100);
  const copiesPerPage = clampNumber(copiesPerPageInput.value, 1, 9);
  const pages = Math.ceil(copies / copiesPerPage);
  const selectedPages = preview ? null : selectedPageNumbers(pages);

  copiesInput.value = copies;
  target.replaceChildren();
  for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
    const pageNumber = pageIndex + 1;
    if (selectedPages && !selectedPages.has(pageNumber)) continue;
    const remaining = copies - pageIndex * copiesPerPage;
    target.appendChild(createPrintPage(lastObjectUrl, Math.min(copiesPerPage, remaining), preview, pageNumber));
  }
  const printedPages = selectedPages ? target.children.length : pages;
  pageCount.textContent = `${printedPages} sheet${printedPages === 1 ? '' : 's'} • ${copies} print${copies === 1 ? '' : 's'}`;
  return printedPages;
}

function applyPrintOptions() {
  const marginMap = { none: '0mm', small: '8mm', default: '12mm' };
  const scale = scaleModeInput.value === 'custom' ? clampNumber(scalePercentInput.value, 25, 200) : 100;

  scalePercentInput.value = scale;
  document.body.dataset.colorMode = colorModeInput.value;
  document.body.dataset.includeBackground = includeBackgroundInput.checked ? 'on' : 'off';
  document.body.dataset.scaleMode = scaleModeInput.value;
  document.body.style.setProperty('--print-margin', marginMap[marginModeInput.value] || marginMap.small);
  document.body.style.setProperty('--print-scale', String(scale / 100));
  document.body.style.setProperty('--image-offset-x', `${offsetXInput.value}%`);
  document.body.style.setProperty('--image-offset-y', `${offsetYInput.value}%`);
}

function updatePrintPreview() {
  syncCopiesWithLayout();
  const paperSize = paperSizeInput.value;
  const orientation = orientationInput.value;
  const fitMode = fitModeInput.value;
  const paper = paperSizes[paperSize];
  const paperLabel = paper.label;
  const [width, height] = paper[orientation];
  const [cols, rows] = printLayouts[clampNumber(copiesPerPageInput.value, 1, 9)] || printLayouts[1];

  document.body.dataset.paperSize = paperSize;
  document.body.dataset.orientation = orientation;
  document.body.dataset.fitMode = fitMode;
  document.body.dataset.cutLines = showCutLinesInput.checked ? 'on' : 'off';
  document.body.style.setProperty('--paper-width', `${width}mm`);
  document.body.style.setProperty('--paper-height', `${height}mm`);
  document.body.style.setProperty('--paper-ratio', String(width / height));
  document.body.style.setProperty('--copies-per-page', String(copiesPerPageInput.value));
  document.body.style.setProperty('--print-cols', String(cols));
  document.body.style.setProperty('--print-rows', String(rows));
  document.body.style.setProperty('--print-gap', `${printGapInput.value}mm`);
  paperInfo.textContent = `${paperLabel} • ${width} × ${height} mm • ${orientation}`;
  applyPrintOptions();
  buildPrintPages(printPreviewPages, true);
}

function openPrintPreview() {
  if (!lastObjectUrl) return;
  printImage.src = lastObjectUrl;
  updatePrintPreview();
  printDialog.hidden = false;
  printDialog.setAttribute('aria-hidden', 'false');
}

function closePrintPreview() {
  printDialog.hidden = true;
  printDialog.setAttribute('aria-hidden', 'true');
}

fileInput.addEventListener('change', () => {
  selectedFile = fileInput.files?.[0] || null;
  cleanBtn.disabled = !selectedFile;
  cleanPreview.removeAttribute('src');
  printImage.removeAttribute('src');
  printPreviewPages.replaceChildren();
  printPages.replaceChildren();
  downloadLink.hidden = true;
  printBtn.hidden = true;
  closePrintPreview();
  if (selectedFile) {
    originalPreview.src = URL.createObjectURL(selectedFile);
    setStatus(`Selected: ${selectedFile.name}`);
  }
});


function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the uploaded image.'));
    image.src = URL.createObjectURL(file);
  });
}

function clampByte(value) {
  return Math.max(0, Math.min(255, value));
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  return values[Math.min(values.length - 1, Math.max(0, Math.floor((values.length - 1) * fraction)))];
}

function stretchValue(value, low, high) {
  return clampByte(((value - low) * 255) / Math.max(1, high - low));
}

function channelStats(values) {
  const sample = [];
  const step = Math.max(1, Math.floor(values.length / 20000));
  for (let i = 0; i < values.length; i += step) sample.push(values[i]);
  return { low: percentile(sample, 0.02), high: percentile(sample, 0.98) };
}

function buildIntegral(values, width, height) {
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    const row = (y + 1) * (width + 1);
    const prev = y * (width + 1);
    for (let x = 0; x < width; x += 1) {
      rowSum += values[y * width + x];
      integral[row + x + 1] = integral[prev + x + 1] + rowSum;
    }
  }
  return integral;
}

function localMean(integral, width, height, x, y, radius) {
  const x1 = Math.max(0, x - radius);
  const y1 = Math.max(0, y - radius);
  const x2 = Math.min(width - 1, x + radius);
  const y2 = Math.min(height - 1, y + radius);
  const stride = width + 1;
  const sum = integral[(y2 + 1) * stride + x2 + 1]
    - integral[y1 * stride + x2 + 1]
    - integral[(y2 + 1) * stride + x1]
    + integral[y1 * stride + x1];
  return sum / ((x2 - x1 + 1) * (y2 - y1 + 1));
}

function makeLuminance(data) {
  const gray = new Float32Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}

function normalizeIllumination(values, width, height) {
  const radius = Math.max(12, Math.round(Math.min(width, height) / 38));
  const integral = buildIntegral(values, width, height);
  const normalized = new Float32Array(values.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = y * width + x;
      const background = Math.max(1, localMean(integral, width, height, x, y, radius));
      normalized[p] = clampByte((values[p] / background) * 245);
    }
  }
  return normalized;
}

function cleanPixels(imageData, mode) {
  const data = imageData.data;
  const { width, height } = imageData;
  const gray = makeLuminance(data);
  const normalizedGray = normalizeIllumination(gray, width, height);
  const grayStats = channelStats(normalizedGray);

  if (mode === 'clean_bw') {
    const normalizedIntegral = buildIntegral(normalizedGray, width, height);
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      const bright = stretchValue(normalizedGray[p], grayStats.low, grayStats.high);
      const localPaper = localMean(normalizedIntegral, width, height, p % width, Math.floor(p / width), 10);
      const threshold = Math.max(135, Math.min(210, localPaper - 24));
      const out = bright < threshold ? 0 : 255;
      data[i] = out; data[i + 1] = out; data[i + 2] = out;
    }
    return imageData;
  }

  if (mode === 'soft_gray') {
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      const out = stretchValue(normalizedGray[p], grayStats.low, grayStats.high) * 1.04;
      data[i] = clampByte(out); data[i + 1] = clampByte(out); data[i + 2] = clampByte(out);
    }
    return imageData;
  }

  if (mode === 'photo_xerox') {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clampByte(data[i] * 1.05 + 10);
      data[i + 1] = clampByte(data[i + 1] * 1.05 + 10);
      data[i + 2] = clampByte(data[i + 2] * 1.05 + 10);
    }
    return imageData;
  }

  for (let channel = 0; channel < 3; channel += 1) {
    const values = new Float32Array(data.length / 4);
    for (let i = channel, p = 0; i < data.length; i += 4, p += 1) values[p] = data[i];
    const normalized = normalizeIllumination(values, width, height);
    const stats = channelStats(normalized);
    for (let i = channel, p = 0; i < data.length; i += 4, p += 1) {
      const boost = mode === 'color_xerox' ? 1.08 : 1;
      data[i] = clampByte(stretchValue(normalized[p], stats.low, stats.high) * boost);
    }
  }
  return imageData;
}

function canvasToBlob(canvas, type, quality = 0.94) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

function binaryFromDataUrl(dataUrl) {
  const raw = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function makePdfBlob(canvas) {
  const jpg = binaryFromDataUrl(canvas.toDataURL('image/jpeg', 0.94));
  const pageW = 595;
  const pageH = 842;
  const margin = 36;
  const scale = Math.min((pageW - margin * 2) / canvas.width, (pageH - margin * 2) / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const add = part => {
    const bytes = typeof part === 'string' ? encoder.encode(part) : part;
    chunks.push(bytes);
    offset += bytes.length;
  };
  const offsets = [0];
  const obj = body => { offsets.push(offset); add(`${offsets.length - 1} 0 obj\n${body}\nendobj\n`); };
  add('%PDF-1.4\n');
  obj('<< /Type /Catalog /Pages 2 0 R >>');
  obj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offsets.push(offset);
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
  add(jpg);
  add('\nendstream\nendobj\n');
  const content = `q\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
  obj(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  const xref = offset;
  add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach(pos => add(`${String(pos).padStart(10, '0')} 00000 n \n`));
  add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: 'application/pdf' });
}

async function cleanImageInBrowser(file, mode, format) {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const maxSide = 2200;
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.putImageData(cleanPixels(ctx.getImageData(0, 0, canvas.width, canvas.height), mode), 0, 0);
  if (format === 'pdf') return makePdfBlob(canvas);
  if (format === 'jpg') return canvasToBlob(canvas, 'image/jpeg', 0.94);
  return canvasToBlob(canvas, 'image/png');
}

async function cleanImage(file, mode, format) {
  try {
    const response = await fetch(`/api/clean?mode=${encodeURIComponent(mode)}&format=${encodeURIComponent(format)}`, {
      method: 'POST',
      body: (() => { const data = new FormData(); data.append('file', file); return data; })(),
    });
    if (response.ok) return response.blob();
  } catch (error) {
    // Static GitHub Pages has no API; fall back to browser-only cleanup.
  }
  return cleanImageInBrowser(file, mode, format);
}

cleanBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  cleanBtn.disabled = true;
  setStatus('Cleaning image...');
  downloadLink.hidden = true;
  printBtn.hidden = true;
  closePrintPreview();

  const mode = modeInput.value;
  const format = formatInput.value;

  try {
    const blob = await cleanImage(selectedFile, mode, format);
    if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = URL.createObjectURL(blob);

    if (formatInput.value === 'pdf') {
      cleanPreview.removeAttribute('src');
      printImage.removeAttribute('src');
      printPreviewPages.replaceChildren();
      printPages.replaceChildren();
      printBtn.hidden = true;
      setStatus('PDF is ready. Download it, or choose PNG/JPG for custom print preview.');
    } else {
      cleanPreview.src = lastObjectUrl;
      printImage.src = lastObjectUrl;
      printBtn.hidden = false;
      setStatus('Cleaned image is ready. Open print preview for copies and multi-up layouts.');
    }

    const ext = formatInput.value === 'jpg' ? 'jpg' : formatInput.value;
    downloadLink.href = lastObjectUrl;
    downloadLink.download = `one-click-xerox-clean.${ext}`;
    downloadLink.hidden = false;
  } catch (error) {
    setStatus(error.message);
  } finally {
    cleanBtn.disabled = !selectedFile;
  }
});

printBtn.addEventListener('click', openPrintPreview);
closePrintBtn.addEventListener('click', closePrintPreview);
printDialog.addEventListener('click', event => {
  if (event.target === printDialog) closePrintPreview();
});
[paperSizeInput, orientationInput, fitModeInput, copiesInput, copiesPerPageInput, printGapInput, showCutLinesInput, pageRangeInput, customPageRangeInput, colorModeInput, marginModeInput, scaleModeInput, scalePercentInput, includeBackgroundInput, offsetXInput, offsetYInput]
  .forEach(input => input.addEventListener('change', updatePrintPreview));
[offsetXInput, offsetYInput].forEach(input => input.addEventListener('input', updatePrintPreview));
resetPositionBtn.addEventListener('click', () => {
  offsetXInput.value = 0;
  offsetYInput.value = 0;
  updatePrintPreview();
});
confirmPrintBtn.addEventListener('click', () => {
  if (!lastObjectUrl) return;
  updatePrintPreview();
  applyPrintOptions();
  buildPrintPages(printPages);
  window.print();
});
