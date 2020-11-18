import {inflateRawSync as decompress} from 'zlib';

addEventListener('message', (event) => {
    const {searchQuery, caseSensitivity, frames} = event.data;

    // compute the frames matching the query
    const matches = [];
    const regexp = new RegExp(searchQuery, caseSensitivity ? '' : 'i');
    for (const [index, frame] of frames.entries()) {
        // XXX cannot access getters here
        const text = decompress(Buffer.from(frame._outputText)).toString();
        if (regexp.test(text)) {
            matches.push(index);
        }
    }

    // return the matches to the caller
    postMessage(matches);
});
