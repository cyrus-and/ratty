export function build(searchQuery, caseSensitivity, global) {
    try {
        return new RegExp(searchQuery, `${caseSensitivity ? '' : 'i'}${global ? 'g' : ''}`);
    } catch {
        return null;
    }
}
