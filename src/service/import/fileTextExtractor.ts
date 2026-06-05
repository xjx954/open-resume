type SupportedImportFileType = 'markdown' | 'docx' | 'pdf' | 'text';

function getFileExtension(file: File): string {
  const name = file.name.toLowerCase();
  const index = name.lastIndexOf('.');
  return index === -1 ? '' : name.slice(index + 1);
}

export function getSupportedImportFileType(file: File): SupportedImportFileType | null {
  const extension = getFileExtension(file);
  if (extension === 'md' || extension === 'markdown') return 'markdown';
  if (extension === 'txt') return 'text';
  if (extension === 'docx') return 'docx';
  if (extension === 'pdf') return 'pdf';
  return null;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        resolve(text);
      } else {
        reject(new Error('文件内容不是文本'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const buffer = event.target?.result;
      if (buffer instanceof ArrayBuffer) {
        resolve(buffer);
      } else {
        reject(new Error('文件内容不是二进制数据'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableWorker: true,
  } as any).promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join('\n\n').trim();
}

export async function extractResumeImportText(file: File): Promise<string> {
  const type = getSupportedImportFileType(file);
  if (!type) {
    throw new Error('仅支持 .md、.txt、.docx、.pdf 文件');
  }

  if (type === 'docx') {
    return extractDocxText(file);
  }

  if (type === 'pdf') {
    return extractPdfText(file);
  }

  return readFileAsText(file);
}
