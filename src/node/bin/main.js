#!/usr/bin/env node

const chalk = require('chalk');
const log = require('../lib/log');
const package = require('../../../package.json');
const program = require('commander');

program
    .version(package.version, '-v, --version', 'Print the version number')
    .description(package.description)
    .helpOption('-h, --help', 'Print the command line options')
    .addHelpCommand(false);

program
    .command('record [<argv>...]')
    .description('Record a terminal session to file.')
    .option('-o, --output <file>', 'Session file', `session-${new Date().toISOString()}.${package.name}`)
    .option('-t, --interval <ms>', 'Minimum interval between frames', 100)
    .option('-S, --no-stdin', 'Do not record standard input')
    .action((argv, options) => {
        const record = require('../lib/record');

        // use the current shell as the default command
        if (argv.length === 0) {
            argv = [process.env.SHELL || '/bin/sh'];
        }

        try {
            // clean the screen before starting
            process.stdout.write('\x1bc');
            log.info(`Saving session to '${options.output}'`);

            // run the program and start recording
            record(argv, options, (status, signal) => {
                let message = `Program exited with status ${status}`;
                if (signal) {
                    message += ` (killed by signal ${signal})`;
                }
                log.info(message);
                log.info(`Session saved to '${options.output}'`);
            });
        } catch (err) {
            log.error(err.message);
        }
    });

program
    .command('play [<file>]')
    .description('Start the web player optionally autoloading a session.')
    .option('--host <host>', 'Start the server on <host>', 'localhost')
    .option('--port <port>', 'Start the server on <port> instead of random', 0)
    .option('-s, --serve-everything', 'Serve arbitrary session files')
    .option('-O, --no-open', 'Do not open the URL automatically')
    .action((session, options) => {
        const open = require('open');
        const path = require('path');
        const play = require('../lib/play');

        // find the absolute path unless it is an url and add it to the hash
        if (session && !/^https?:/.test(session)) {
            session = path.resolve(session);
        }

        // serve the player
        const server = play(session, options).on('listening', () => {
            // compute the listening URL
            let url = `http://${options.host}:${server.address().port}`;

            // add the session if provided
            if (session) {
                url += `#${session}`;
            }

            log.info(`Player running at ${url}`);
            log.info('Use Ctrl-C to exit...');

            // open the browser automatically
            if (options.open) {
                open(url);
            }
        }).on('error', (err) => {
            log.error(`Cannot start server: ${err}`);
        });

        // allow a clean exit status on Ctrl-C
        process.once('SIGINT', () => {
            process.exit();
        });
    });

// XXX hack to add a banner to help commands
const accent = chalk.hex('#ff6000');
for (const command of [program, ...program.commands]) {
    command.outputHelp = command.outputHelp.bind(command, (help) => {
        return `
     ${accent('__QQ')}         __    __
  __${accent('( )_">')}_______/  |__/  |____ __
  \\_ ${accent(')')}__ \\__  \\___  ____  __/  |  \\
   |  | \\/  __ \\ |  |  |  | \\___  /
   |__|  \\_____/ |__|  |__| / ___/
  ${accent(('v' + package.version).padStart(25, ' '))} \\/

` + help;
    });
}

program.parse(process.argv);
