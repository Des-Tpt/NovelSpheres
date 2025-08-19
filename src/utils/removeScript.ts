export function removeScriptsFromHtml(html: string): string {
    // Tạo một DOM tạm để parse string
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Xóa tất cả thẻ <script>
    doc.querySelectorAll('script').forEach(script => script.remove());

    // Trả về innerHTML đã lọc
    return doc.body.innerHTML;
}

export default removeScriptsFromHtml;