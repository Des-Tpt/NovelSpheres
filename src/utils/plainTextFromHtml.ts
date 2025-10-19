import * as cheerio from 'cheerio';

function getPlainTextFromHtml(html: string | undefined | null): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    try {
        const plainText = cheerio.load(html);
        plainText("script, style").remove();
        return plainText.text().trim(); 
    } catch (error) {
        console.error('Error extracting text from HTML:', error);
        return '';
    }
}

export default getPlainTextFromHtml;
