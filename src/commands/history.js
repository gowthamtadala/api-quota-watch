const chalk    = require('chalk');
const storage  = require('../utils/storage');
const formatter = require('../utils/formatter');

async function history(provider, options = {}) {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.'));
        console.log(chalk.gray(`Run ${chalk.cyan('aqw add')} to add an API.\n`));
        return;
    }

    // If a specific provider is given, validate it
    if (provider && !apis[provider]) {
        console.log(chalk.red(`\n❌ Provider "${provider}" not found.`));
        console.log(chalk.gray(`   Configured: ${Object.keys(apis).join(', ')}\n`));
        return;
    }

    const providers = provider ? [provider] : Object.keys(apis);
    const days      = parseInt(options.days || 30);

    console.log(chalk.bold.cyan(`\n📈 Quota History (last ${days} days)\n`));

    let anyData = false;

    for (const p of providers) {
        const allHistory = storage.getQuotaHistory(p);

        // Filter to requested window
        const cutoff   = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const filtered = allHistory.filter(h => new Date(h.timestamp) >= cutoff);

        const alias = apis[p]?.alias && apis[p].alias !== p ? ` (${apis[p].alias})` : '';

        console.log(chalk.bold(`  ${p}${alias}`));
        console.log(chalk.gray('  ' + '─'.repeat(50)));

        if (filtered.length === 0) {
            console.log(chalk.gray('  No history in this window. Run ') + chalk.cyan('aqw monitor') + chalk.gray(' to collect data.\n'));
            continue;
        }

        anyData = true;

        // Sparkline
        const sparkline = formatter.formatSparkline(filtered, 40);
        sparkline.split('\n').forEach(line => console.log('  ' + line));

        // Latest reading
        const latest     = filtered[filtered.length - 1];
        const latestPct  = latest.limit > 0 ? (latest.used / latest.limit) * 100 : 0;
        const latestBar  = formatter.formatProgressBar(latestPct, 20, latest.used, latest.limit, latest.unit);
        console.log(chalk.gray('\n  Latest: ') + latestBar);

        // Burn rate
        const burnRate = formatter.formatBurnRate(filtered, latest.used, latest.limit);
        if (burnRate) {
            console.log('  ' + burnRate);
        }

        // Sample count
        console.log(chalk.gray(`\n  ${filtered.length} data point${filtered.length !== 1 ? 's' : ''} collected`));
        console.log('');
    }

    if (!anyData) {
        console.log(chalk.gray('  Run ') + chalk.cyan('aqw monitor') + chalk.gray(' at least once to start collecting history.\n'));
    }
}

module.exports = history;
