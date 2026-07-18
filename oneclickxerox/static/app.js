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

cleanBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  cleanBtn.disabled = true;
  setStatus('Cleaning image...');
  downloadLink.hidden = true;
  printBtn.hidden = true;
  closePrintPreview();

  const data = new FormData();
  data.append('file', selectedFile);
  const mode = encodeURIComponent(modeInput.value);
  const format = encodeURIComponent(formatInput.value);

  try {
    const response = await fetch(`/api/clean?mode=${mode}&format=${format}`, { method: 'POST', body: data });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Cleanup failed.' }));
      throw new Error(error.detail || 'Cleanup failed.');
    }
    const blob = await response.blob();
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
