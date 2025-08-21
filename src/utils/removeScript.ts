import * as cheerio from 'cheerio';

function removeScriptsFromHtml(html: string | undefined | null): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    try {
        const $ = cheerio.load(html);
        $("script").remove();
        return $.html();
    } catch (error) {
        console.error('Error removing scripts from HTML:', error);
        return html;
    }
}

export default removeScriptsFromHtml;