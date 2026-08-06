const chalk   = require('chalk');
const ora     = require('ora');
const storage  = require('../utils/storage');
const formatter = require('../utils/formatter');
const OpenAIProvider     = require('../providers/openai');
const StripeProvider     = require('../providers/stripe');
const GitHubProvider     = require('../providers/github');
const AnthropicProvider  = require('../providers/anthropic');
const GroqProvider       = require('../providers/groq');
const MistralProvider    = require('../providers/mistral');
const OpenRouterProvider = require('../providers/openrouter');

const PROVIDER_CLASSES = {
    openai:     OpenAIProvider,
    stripe:     StripeProvider,
    github:     GitHubProvider,
    anthropic:  AnthropicProvider,
    groq:       GroqProvider,
    mistral:    MistralProvider,
    openrouter: OpenRouterProvider
};

async function monitor(options) {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.'));
        console.log(chalk.gray(`Run ${chalk.cyan('aqw add')} to add an API.\n`));
        return;
    }

    if (options.watch) {
        console.log(chalk.cyan(`\n👀 Watching quotas (checking every ${options.interval} minutes)...`));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));

        await checkAllQuotas(options);
        setInterval(async () => {
            console.log(chalk.gray(`\n─── ${new Date().toLocaleTimeString()} ──────────────────────────\n`));
            await checkAllQuotas(options);
        }, options.interval * 60 * 1000);
    } else {
        await checkAllQuotas(options);
    }
}

async function checkAllQuotas(options = {}) {
    const apis    = storage.getAPIs();
    const alerts  = storage.getAlerts();
    const results = [];

    const { sendThresholdAlert } = require('../utils/webhook');

    for (const [provider, config] of Object.entries(apis)) {
        const alias   = config.alias && config.alias !== provider ? ` (${config.alias})` : '';
        const spinner = ora(`Checking ${provider}${alias}...`).start();

        try {
            const ProviderClass    = PROVIDER_CLASSES[provider];
            if (!ProviderClass) {
                spinner.warn(`${provider}: unknown provider, skipping`);
                continue;
            }

            const providerInstance = new ProviderClass(config.apiKey);
            const quota            = await providerInstance.getQuota();

            spinner.succeed(`${provider}${alias} checked`);
            storage.saveQuotaHistory(provider, quota);

            if (quota.limit === 0) {
                console.log(chalk.yellow(`   ${quota.details?.note || 'Quota data not available'}`));
                continue;
            }

            const formatted   = formatter.formatQuotaStatus(provider, quota);
            const percentage  = (quota.used / quota.limit) * 100;
            const alertConfig = alerts[provider];
            const history     = storage.getQuotaHistory(provider);

            // Print inline progress bar
            console.log(`  ${chalk.bold(provider)}${alias ? chalk.gray(alias) : ''}`);
            console.log(`  ${formatted.bar}`);

            // Burn rate
            const burnLine = formatter.formatBurnRate(history, quota.used, quota.limit);
            if (burnLine) {
                console.log(`  ${burnLine}`);
            }

            // Alert threshold check — now actually fires the webhook
            if (alertConfig && percentage >= alertConfig.threshold) {
                const alertMsg = chalk.red(`\n  🚨 ALERT: ${provider} at ${percentage.toFixed(1)}% (threshold: ${alertConfig.threshold}%)`);
                console.log(alertMsg);

                if (alertConfig.webhook) {
                    try {
                        await sendThresholdAlert(alertConfig.webhook, provider, percentage, alertConfig.threshold);
                        console.log(chalk.gray(`     ↪ Alert sent to webhook`));
                    } catch (webhookErr) {
                        console.log(chalk.red(`     ↪ Webhook failed: ${webhookErr.message}`));
                    }
                }
            }

            results.push({ ...formatted, percentage });

        } catch (error) {
            spinner.fail(`${provider} failed`);
            console.log(chalk.red(`   Error: ${error.message}`));
        }
    }

    // Summary line
    if (results.length > 0) {
        console.log('\n' + formatter.formatSummary(results));

        if (!options.noTable) {
            console.log('\n' + formatter.createTable(results) + '\n');
        }
    }
}

module.exports = monitor;
module.exports.checkAllQuotas = checkAllQuotas;
