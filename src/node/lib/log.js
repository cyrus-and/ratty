const chalk = require('chalk');

function log(marker, message) {
    console.log(`${chalk.inverse(marker)} ${message}`);
}

function info(message) {
    log(chalk.green(' INFO '), message);
}

function error(message) {
    log(chalk.red(' ERROR '), message);
}

module.exports = {info, error};
