import {inflateRawSync as decompress} from 'zlib';

addEventListener('message', (event) => {
    const {searchQuery, caseSensitivity, baseIndex, frames} = event.data;

    // compute the frames matching the query
    const regexp = new RegExp(searchQuery, caseSensitivity ? '' : 'i');
    for (const [index, frame] of frames.entries()) {
        // XXX cannot access getters here
        const text = decompress(Buffer.from(frame._outputText)).toString();
        if (regexp.test(text)) {
            // return the index to the caller
            postMessage(baseIndex + index);
        }
    }
});
