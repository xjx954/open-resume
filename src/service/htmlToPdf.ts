import axios from 'axios';

const pdfApiUrl = process.env.REACT_APP_PDF_API_URL;

export interface PdfParams {
    htmlContent: string
    theme: string
    themeColor: string
    isMark: boolean
    watermarkText?: string
    isOnePage: boolean
}

/**
 * Generate PDF from the backend service.
 * Returns a Blob URL that can be downloaded directly.
 */
export async function generatePdfBlob(params: PdfParams): Promise<string> {
    if (!pdfApiUrl) {
        throw new Error('未配置 PDF 生成服务，请设置 REACT_APP_PDF_API_URL 指向后端代理接口。');
    }

    const res = await axios.post(pdfApiUrl, params, {
        timeout: 30 * 1000,
        responseType: 'blob',
    });

    return URL.createObjectURL(res.data);
}
