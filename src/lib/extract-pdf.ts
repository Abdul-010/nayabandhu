import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const MAX_PDF_PAGES = 50;
const MAX_EXTRACTED_CHARACTERS = 200_000;

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;
  if (document.numPages > MAX_PDF_PAGES) {
    await loadingTask.destroy();
    throw new Error("PDFs can contain up to 50 pages.");
  }
  const pages: string[] = [];
  let totalCharacters = 0;
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ").trim();
      if (pageText) {
        pages.push(pageText);
        totalCharacters += pageText.length;
        if (totalCharacters > MAX_EXTRACTED_CHARACTERS) {
          throw new Error("This document contains too much text to index (maximum 200,000 characters).");
        }
      }
    }
  } finally {
    await loadingTask.destroy();
  }
  const text = pages.join("\n\n").trim();
  if (!text) throw new Error("No selectable text was found. Scanned-image PDFs are not supported yet.");
  return text;
}