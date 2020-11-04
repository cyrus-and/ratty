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
        const terminal = new Terminal();
        const serializeAddon = new SerializeAddon();
        terminal.loadAddon(serializeAddon);

        // extract and process frames out of the session
        let lastDelay;
        let rows;
        let columns;
        for (const [index, event] of events.entries()) {
            switch (event.type) {
                case 'start':
                    this._meta.start = event.timestamp;
                    this._meta.command = event.command;
                    this.emit('start');
                    break;

                case 'finish':
                    this._meta.finish = event.timestamp;
                    this.emit('finish');
                    break;

                case 'frame':
                    // compute the time difference to obtain the frame delay
                    const delay = event.delay - (lastDelay || 0);

                    // write the record data to the terminal and read back the buffer
                    await new Promise((fulfill) => terminal.write(event.output, fulfill));
                    const buffer = serializeAddon.serialize();

                    // update the last delay
                    lastDelay = event.delay;

                    // add a new frame
                    const frame = {
                        cumulativeDelay: event.delay,
                        delay,
                        output: buffer,
                        input: event.input,
                        rows, columns
                    };
                    this._frames.push(frame);

                    // notify the frame
                    this.emit('frame', frame, this._frames.length);
                    break;

                case 'resize':
                    // update the terminal size
                    terminal.resize(columns = event.columns, rows = event.rows);
                    break;
            }

            // notify the progress
            this.emit('progress', (index + 1) / events.length);
        }
    }
}
