const fs = require('fs');
const pty = require('node-pty');
const tty = require('../../../build/Release/tty.node');

function record(argv, sessionPath, interval, callback) {
    function emitEvent(event) {
        // writes one JSON object (event) per line
        fs.writeSync(session, JSON.stringify(event) + '\n');
    }

    function flush() {
        // nothing to do if buffers are empty (this may happen when the process just exits)
        if (!input && !output) {
            return;
        }

        // compute the delay relative to the epoch
        delay = timestamp - epoch;

        // save the JSON representation of the record (one per line)
        emitEvent(['frame', delay, input, output]);

        // continue with empty buffers
        input = output = '';
    }

    function resize() {
        const {columns, rows} = process.stdout;

        // resize the terminal
        ptyProcess.resize(columns, rows);

        // emit the resize event
        emitEvent(['resize', columns, rows]);
    }

    // reset state
    let epoch;
    let timestamp;
    let input = '';
    let output = '';

    // open the session file
    const session = fs.openSync(sessionPath, 'w', 0o600);

    // write the header
    emitEvent(['start', new Date().toISOString(), argv]);

    // set the terminal raw mode
    tty.enterRawMode();

    // run the command
    const ptyProcess = pty.spawn(argv[0], argv.slice(1));

    // handle the terminal resize and syntetically trigger the first time
    process.stdout.on('resize', resize);
    resize();

    // process data coming from stdin
    process.stdin.on('data', (chunk) => {
        // store the chunk in the buffer and hand it to the PTY process
        input += chunk;
        ptyProcess.write(chunk);
    });

    // process data coming from the PTY
    ptyProcess.on('data', (chunk) => {
        // read the next chunk and mark the timestamp in milliseconds
        const now = Number(process.hrtime.bigint() / 1000000n);

        // the first chunk marks the epoch
        if (epoch === undefined) {
            epoch = timestamp = now;
        }

        // if the time passed since the last flush is enough
        const delta = now - timestamp;
        if (delta > interval) {
            // flush again then update the timestamp for the current frame
            flush();
            timestamp = now;
        }

        // store the chunk in the buffer and hand it to stdout
        output += chunk;
        process.stdout.write(chunk);
    });

    // handle the termination of the process
    ptyProcess.on('exit', (status, signal) => {
        // write the pending data in the buffers and finalize
        flush();

        // write the footer
        emitEvent(['finish', new Date().toISOString()]);

        // finish the session
        fs.closeSync(session);

        // destroy stdin so to allow the process to exit
        process.stdin.destroy();

        // reset the terminal TTY mode
        tty.leaveRawMode();

        // notify the caller
        callback(status, signal);
    });
}

module.exports = record;
