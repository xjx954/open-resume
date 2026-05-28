import axios from 'axios';

const pdfApiUrl = process.env.REACT_APP_PDF_API_URL;

export interface PdfParams {
    htmlContent: string
    theme: string
    themeColor: string
    isMark: boolean
    isOnePage: boolean
    pages: string
}

export interface PdfResult {
    url: string
}

export async function getPdf(params: PdfParams): Promise<PdfResult> {
    if (!pdfApiUrl) {
        throw new Error('未配置 PDF 生成服务，请设置 REACT_APP_PDF_API_URL 指向后端代理接口。');
    }

    const res = await axios.post<PdfResult>(pdfApiUrl, params, {
        timeout: 15 * 1000,
        withCredentials: true,
    });
    return res.data;
}
