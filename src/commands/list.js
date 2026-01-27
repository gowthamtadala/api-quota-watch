const chalk = require('chalk');
const Table = require('cli-table3');
const storage = require('../utils/storage');
const { formatDistance } = require('date-fns');

async function list() {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.\n'));
        return;
    }

    const table = new Table({
        head: ['Provider', 'Alias', 'Added', 'API Key'],
        style: { head: ['cyan', 'bold'] }
    });

    for (const [provider, config] of Object.entries(apis)) {
        const maskedKey = config.apiKey.substring(0, 8) + '...' +
            config.apiKey.substring(config.apiKey.length - 4);

        const addedAt = formatDistance(new Date(config.addedAt), new Date(), { addSuffix: true });

        table.push([
            chalk.bold(provider),
            config.alias || '-',
            addedAt,
            maskedKey
        ]);
    }

    console.log('\n' + table.toString() + '\n');
}

module.exports = list;
