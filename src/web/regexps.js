function unicodeEscape(string) {
    // turn each code point into its unicode representation
    return Array.from(string).map((chunk) => {
        return `\\u{${chunk.codePointAt(0).toString(16)}}`;
    }).join('');
}

export function build(searchQuery, caseSensitivity, global) {
    const baseFlags = `${caseSensitivity ? '' : 'i'}${global ? 'g' : ''}`;

    try {
        return new RegExp(searchQuery, baseFlags);
    } catch {
        // treat invalid regexps literally
        return new RegExp(unicodeEscape(searchQuery), `u${baseFlags}`);
    }
}
