const chalk     = require('chalk');
const ora       = require('ora');
const fs        = require('fs');
const path      = require('path');
const storage   = require('../utils/storage');
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

/**
 * aqw report
 *
 * Generates a structured usage snapshot for all monitored APIs.
 * Foundation for future team/org aggregation.
 *
 * Options:
 *   --format json|csv   Output format (default: terminal table)
 *   --output <file>     Write to file instead of stdout
 *   --cached            Use stored history instead of making live API calls
 */
async function report(options = {}) {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.'));
        console.log(chalk.gray(`Run ${chalk.cyan('aqw add')} to add an API.\n`));
        return;
    }

    const format  = options.format || 'terminal';
    const cached  = options.cached || false;
    const liveData = {};

    // ── Live data fetch ──────────────────────────────────────────────────────
    if (!cached) {
        console.log(chalk.cyan('\n📡 Fetching live quota data...\n'));

        for (const [provider, config] of Object.entries(apis)) {
            const spinner = ora(`  ${provider}`).start();
            try {
                const ProviderClass = PROVIDER_CLASSES[provider];
                if (!ProviderClass) { spinner.warn(`${provider}: unknown provider`); continue; }

                const instance = new ProviderClass(config.apiKey);
                const quota    = await instance.getQuota();
                liveData[provider] = quota;
                storage.saveQuotaHistory(provider, quota);
                spinner.succeed(`  ${provider}`);
            } catch (err) {
                spinner.fail(`  ${provider}: ${err.message}`);
            }
        }
    } else {
        console.log(chalk.gray('\n📦 Using cached history data...\n'));
    }

    // ── Build report ─────────────────────────────────────────────────────────
    const reportData = storage.getReportData(liveData);

    if (reportData.apis.length === 0) {
        console.log(chalk.yellow('No quota data available. Run ') + chalk.cyan('aqw monitor') + chalk.yellow(' first.\n'));
        return;
    }

    // ── Output ───────────────────────────────────────────────────────────────
    if (format === 'terminal') {
        _printTerminalReport(reportData);
    } else {
        const serialized = formatter.serializeReport(reportData, format);

        if (options.output) {
            const outPath = path.resolve(options.output);
            fs.writeFileSync(outPath, serialized, 'utf8');
            console.log(chalk.green(`\n✅ Report saved to ${outPath}\n`));
        } else {
            console.log('\n' + serialized + '\n');
        }
    }
}

function _printTerminalReport(data) {
    const Table = require('cli-table3');

    console.log(chalk.bold.cyan('\n📊 API Quota Report\n'));
    console.log(chalk.gray(`  Reporter : ${data.reporter}`));
    console.log(chalk.gray(`  Generated: ${new Date(data.reportedAt).toLocaleString()}`));
    console.log('');

    const table = new Table({
        head:      ['Provider', 'Alias', 'Usage', 'Used', 'Limit', 'Unit', 'Resets', 'Source'],
        style:     { head: ['cyan', 'bold'] },
        colWidths: [12, 16, 36, 12, 12, 14, 12, 10]
    });

    data.apis.forEach(api => {
        const bar    = formatter.formatProgressBar(api.usedPercent, 16, api.used, api.limit, api.unit);
        const icon   = api.usedPercent >= 95 ? '🔴' : api.usedPercent >= 80 ? '🟡' : '🟢';
        const source = api.dataSource === 'live' ? chalk.green('live') : chalk.gray('cached');

        const resetsLabel = api.resetsAt
            ? (() => {
                try {
                    const d = new Date(api.resetsAt);
                    const diffMs = d - new Date();
                    if (diffMs < 0) return 'now';
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 60) return `in ${diffMins}m`;
                    const diffHrs = Math.floor(diffMins / 60);
                    if (diffHrs < 24) return `in ${diffHrs}h`;
                    return d.toLocaleDateString();
                } catch { return api.resetsAt; }
            })()
            : 'N/A';

        table.push([
            `${icon} ${chalk.bold(api.provider)}`,
            chalk.gray(api.alias),
            bar,
            String(api.used),
            String(api.limit),
            api.unit,
            resetsLabel,
            source
        ]);
    });

    console.log(table.toString());

    // Summary
    const healthy  = data.apis.filter(a => a.usedPercent < 80).length;
    const warning  = data.apis.filter(a => a.usedPercent >= 80 && a.usedPercent < 95).length;
    const critical = data.apis.filter(a => a.usedPercent >= 95).length;

    const parts = [];
    if (healthy  > 0) parts.push(chalk.green(`🟢 ${healthy} healthy`));
    if (warning  > 0) parts.push(chalk.yellow(`🟡 ${warning} warning`));
    if (critical > 0) parts.push(chalk.red(`🔴 ${critical} critical`));

    console.log(chalk.bold('Summary: ') + parts.join(chalk.gray(' · ')) + '\n');
    console.log(chalk.gray(`  Tip: aqw report --format json --output report.json  to export`));
    console.log(chalk.gray(`       aqw report --format csv  --output report.csv   to export for spreadsheets\n`));
}

module.exports = report;
