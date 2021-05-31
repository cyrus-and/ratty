import EventEmitter from 'events';
import process from 'process';
import {SerializeAddon} from 'xterm-addon-serialize';
import {Terminal} from 'xterm';
import {deflateRawSync as compress, inflateRawSync as decompress} from 'zlib';

const FRAME_PROPERTIES = {
    outputAnsi: {
        get: function () {
            return decompress(this._outputAnsi).toString();
        }
    },
    outputText: {
        get: function () {
            return decompress(this._outputText).toString();
        }
    }
};

export default class Session extends EventEmitter {
    constructor(name, data) {
        super();
        this._meta = {name};
        this._frames = [];

        // do the process in the next tick to allow to register the events
        process.nextTick(async () => {
            try {
                // JSON-parse the session data
                const events = data.trim().split('\n').map(JSON.parse);
                await this._startLoading(events);
            } catch (err) {
                this.emit('error', err);
            }
        });
    }

    getMeta() {
        return this._meta;
    }

    getFrames() {
        return this._frames;
    }

    async _startLoading(events) {
        console.time('loading');

        // notify the progress
        this.emit('progress', 0);

        // create the headless terminal and serializer addons
        const terminal = new Terminal({
            scrollback: 0
        });
        const serializeAddon = new SerializeAddon();
        terminal.loadAddon(serializeAddon);

        // extract and process frames out of the session
        let lastDelay;
        let rows;
        let columns;
        let lastOutput;
        let cumulativeInput = '';
        for (const [index, event] of events.entries()) {
            const type = event[0];
            const args = event.slice(1);
            switch (type) {
                case 'start': {
                    [this._meta.start, this._meta.command] = args;

                    this.emit('start');
                    break;
                }

                case 'finish': {
                    [this._meta.finish] = args;

                    this.emit('finish');
                    break;
                }

                case 'frame': {
                    const [cumulativeDelay, input, output] = args;

                    // compute the time difference to obtain the frame delay
                    const delay = cumulativeDelay - (lastDelay || 0);

                    // update the last delay
                    lastDelay = cumulativeDelay;

                    // write the record data to the terminal and read back the buffer
                    await new Promise((fulfill) => terminal.write(output, fulfill));
                    const outputAnsi = serializeAddon.serialize();

                    // accumulate the input in case this frame is skipped
                    cumulativeInput += input;

                    // skip identical adjacent frames
                    if (lastOutput === outputAnsi) {
                        continue;
                    } else {
                        lastOutput = outputAnsi;
                    }

                    // fetch the current frame content as plain text
                    let outputText = '';
                    const buffer = terminal.buffer.active;
                    for (let i = 0; i < buffer.length; i++) {
                        outputText += buffer.getLine(i).translateToString();
                    }

                    // creates a new frame (allowing to inflate lazily its outputs)
                    const frame = Object.defineProperties({
                        cumulativeDelay,
                        delay,
                        input: cumulativeInput,
                        rows, columns,
                        _outputAnsi: compress(outputAnsi),
                        _outputText: compress(outputText)
                    }, FRAME_PROPERTIES);

                    // append and notify the frame
                    this._frames.push(frame);
                    this.emit('frame', frame, this._frames.length - 1);

                    // reset the input buffer since a frame has been emitted
                    cumulativeInput = '';
                    break;
                }

                case 'resize': {
                    [columns, rows] = args;

                    // update the terminal size
                    terminal.resize(columns, rows);
                    break;
                }
            }

            // notify the progress
            this.emit('progress', (index + 1) / events.length);
        }

        console.timeEnd('loading');
    }
}
