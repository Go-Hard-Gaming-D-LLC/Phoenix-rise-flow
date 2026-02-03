
/**
 * Utility function to remove HTML tags from a string.
 * Equivalent to Python's re.sub(r'<[^>]+>', '', text)
 * 
 * @param text The input string containing HTML tags
 * @returns The clean string without HTML tags
 */
export function stripHtmlTags(text: string): string {
    if (!text) return "";
    return text.replace(/<[^>]+>/g, '');
}

/**
 * Utility function to decode HTML entities if needed.
 * (e.g. &amp; -> &, &lt; -> <)
 * simple implementation
 */
export function decodeHtmlEntities(text: string): string {
    if (!text) return "";
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}
