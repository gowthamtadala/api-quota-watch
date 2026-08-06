#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');

const program = new Command();

program
    .name('api-quota-watch')
    .description('Monitor API rate limits and quotas across multiple providers')
    .version(version);

program
    .command('add')
    .description('Add an API to monitor')
    .action(require('./commands/add'));

program
    .command('remove <provider>')
    .description('Remove an API from monitoring')
    .action(require('./commands/remove'));

program
    .command('list')
    .description('List all monitored APIs')
    .action(require('./commands/list'));

program
    .command('monitor')
    .description('Check quota status for all APIs')
    .option('-w, --watch',              'Watch mode — continuous monitoring')
    .option('-i, --interval <minutes>', 'Check interval in minutes (watch mode)', '5')
    .option('--no-table',               'Skip summary table (progress bars only)')
    .action(require('./commands/monitor'));

program
    .command('alert')
    .description('Configure quota alerts (Slack, Discord, or generic webhook)')
    .action(require('./commands/alert'));

program
    .command('history [provider]')
    .description('Show quota usage history with sparkline chart')
    .option('-d, --days <n>', 'Number of days to display', '30')
    .action(require('./commands/history'));

program
    .command('report')
    .description('Generate a structured quota usage report')
    .option('--format <fmt>',   'Output format: terminal (default), json, csv', 'terminal')
    .option('--output <file>',  'Write report to a file (use with --format json|csv)')
    .option('--cached',         'Use stored history instead of live API calls')
    .action(require('./commands/report'));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
