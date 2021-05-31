import * as regexps from './regexps';
import {inflateRawSync as decompress} from 'zlib';

addEventListener('message', (event) => {
    const {searchQuery, caseSensitivity, baseIndex, frames} = event.data;

    // build a regexp to filter frames
    const regexp = regexps.build(searchQuery, caseSensitivity);
    if (regexp === null) {
        return;
    }

    // compute the frames matching the query
    for (const [index, frame] of frames.entries()) {
        // XXX cannot access getters here
        const text = decompress(Buffer.from(frame._outputText)).toString();
        if (regexp.test(text)) {
            // return the index to the caller
            postMessage(baseIndex + index);
        }
    }
});
