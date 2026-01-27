const chalk = require('chalk');
const ora = require('ora');
const storage = require('../utils/storage');
const formatter = require('../utils/formatter');
const OpenAIProvider = require('../providers/openai');
const StripeProvider = require('../providers/stripe');
const GitHubProvider = require('../providers/github');

const PROVIDER_CLASSES = {
    openai: OpenAIProvider,
    stripe: StripeProvider,
    github: GitHubProvider
};

async function monitor(options) {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.'));
        console.log(chalk.gray(`Run ${chalk.cyan('api-quota-watch add')} to add an API.\n`));
        return;
    }

    if (options.watch) {
        console.log(chalk.cyan(`\n👀 Watching quotas (checking every ${options.interval} minutes)...`));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));

        await checkAllQuotas();
        setInterval(async () => {
            console.log(chalk.gray(`\n--- ${new Date().toLocaleTimeString()} ---\n`));
            await checkAllQuotas();
        }, options.interval * 60 * 1000);
    } else {
        await checkAllQuotas();
    }
}

async function checkAllQuotas() {
    const apis = storage.getAPIs();
    const results = [];
    const alerts = storage.getAlerts();

    for (const [provider, config] of Object.entries(apis)) {
        const spinner = ora(`Checking ${provider}...`).start();

        try {
            const ProviderClass = PROVIDER_CLASSES[provider];
            const providerInstance = new ProviderClass(config.apiKey);
            const quota = await providerInstance.getQuota();

            spinner.succeed(`${provider} checked`);

            storage.saveQuotaHistory(provider, quota);

            const formatted = formatter.formatQuotaStatus(provider, quota);
            results.push(formatted);

            const percentage = (quota.used / quota.limit) * 100;
            const alertConfig = alerts[provider];

            if (alertConfig && percentage >= alertConfig.threshold) {
                console.log(chalk.red(`\n🚨 ALERT: ${provider} is at ${percentage.toFixed(1)}% (threshold: ${alertConfig.threshold}%)`));
            }

        } catch (error) {
            spinner.fail(`${provider} failed`);
            console.log(chalk.red(`   Error: ${error.message}`));
        }
    }

    if (results.length > 0) {
        console.log('\n' + formatter.createTable(results) + '\n');
    }
}

module.exports = monitor;
