import EventEmitter from 'events';
import {SerializeAddon} from 'xterm-addon-serialize';
import {Terminal} from 'xterm';

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
        for (const [index, event] of events.entries()) {
            const type = event[0];
            const args = event.slice(1);
            switch (type) {
                case 'start':
                    [this._meta.start, this._meta.command] = args;

                    this.emit('start');
                    break;

                case 'finish':
                    [this._meta.finish] = args;

                    this.emit('finish');
                    break;

                case 'frame':
                    const [cumulativeDelay, input, output] = args;

                    // compute the time difference to obtain the frame delay
                    const delay = cumulativeDelay - (lastDelay || 0);

                    // write the record data to the terminal and read back the buffer
                    await new Promise((fulfill) => terminal.write(output, fulfill));
                    const buffer = serializeAddon.serialize();

                    // update the last delay
                    lastDelay = cumulativeDelay;

                    // add a new frame
                    const frame = {
                        cumulativeDelay,
                        delay,
                        output: buffer,
                        input,
                        rows, columns
                    };
                    this._frames.push(frame);

                    // notify the frame
                    this.emit('frame', frame, this._frames.length);
                    break;

                case 'resize':
                    [columns, rows] = args;

                    // update the terminal size
                    terminal.resize(columns, rows);
                    break;
            }

            // notify the progress
            this.emit('progress', (index + 1) / events.length);
        }
    }
}
