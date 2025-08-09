function getWordCountFromHtml(html: string): number {
    // Bỏ tất cả thẻ HTML
    const plainText = html
        .replace(/<[^>]*>/g, ' ') // bỏ tag HTML
        .replace(/\s+/g, ' ')     // gộp khoảng trắng thừa
        .trim();

    // Nếu trống thì trả về 0
    if (!plainText) return 0;

    // Tách theo khoảng trắng
    return plainText.split(' ').length;
}

export default getWordCountFromHtml;