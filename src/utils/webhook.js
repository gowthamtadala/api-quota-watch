const axios = require('axios');

/**
 * Shared webhook sender utility.
 * Supports: Slack (Block Kit), Discord (embeds), and generic JSON POST.
 */

function detectPlatform(url) {
    if (url.includes('hooks.slack.com')) return 'slack';
    if (url.includes('discord.com/api/webhooks')) return 'discord';
    return 'generic';
}

/**
 * Build a Slack Block Kit message from quota results.
 */
function buildSlackPayload(results, header = '📊 API Quota Report') {
    const statusLine = (r) => {
        const icon = r.usedPercent >= 95 ? '🔴' : r.usedPercent >= 80 ? '🟡' : '🟢';
        const trend = r.trend ? ` ${r.trend}` : '';
        return `${icon} *${r.provider}${r.alias ? ` (${r.alias})` : ''}*: ${r.usedPercent.toFixed(1)}% (${r.used}/${r.limit} ${r.unit})${trend}`;
    };

    const lines = results.map(statusLine).join('\n');

    return {
        blocks: [
            {
                type: 'header',
                text: { type: 'plain_text', text: header, emoji: true }
            },
            {
                type: 'section',
                text: { type: 'mrkdwn', text: lines || '_No quota data available_' }
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `Reported at ${new Date().toLocaleString()} via \`aqw\``
                    }
                ]
            }
        ]
    };
}

/**
 * Build a Discord embed from quota results.
 */
function buildDiscordPayload(results, header = '📊 API Quota Report') {
    const description = results.map(r => {
        const icon = r.usedPercent >= 95 ? '🔴' : r.usedPercent >= 80 ? '🟡' : '🟢';
        return `${icon} **${r.provider}${r.alias ? ` (${r.alias})` : ''}**: ${r.usedPercent.toFixed(1)}% — ${r.used}/${r.limit} ${r.unit}`;
    }).join('\n') || '_No quota data available_';

    return {
        embeds: [{
            title: header,
            description,
            color: results.some(r => r.usedPercent >= 95) ? 0xFF0000
                : results.some(r => r.usedPercent >= 80)  ? 0xFFAA00
                : 0x00CC66,
            footer: { text: `Reported via aqw · ${new Date().toLocaleString()}` }
        }]
    };
}

/**
 * Send a webhook alert for a quota threshold breach.
 *
 * @param {string} url        - Webhook URL
 * @param {string} provider   - Provider name
 * @param {number} percentage - Current usage percentage
 * @param {number} threshold  - Configured alert threshold
 */
async function sendThresholdAlert(url, provider, percentage, threshold) {
    const platform = detectPlatform(url);
    const header = `🚨 Quota Alert: ${provider}`;
    const results = [{
        provider,
        usedPercent: percentage,
        used: percentage.toFixed(1),
        limit: 100,
        unit: '%'
    }];

    let payload;
    if (platform === 'slack') {
        payload = buildSlackPayload(results, header);
        // Add a danger text field
        payload.text = `${header} — at ${percentage.toFixed(1)}% (threshold: ${threshold}%)`;
    } else if (platform === 'discord') {
        payload = buildDiscordPayload(results, header);
    } else {
        payload = {
            alert: true,
            provider,
            percentage,
            threshold,
            timestamp: new Date().toISOString()
        };
    }

    await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
    });
}

/**
 * Send a full quota report to a webhook.
 *
 * @param {string} url     - Webhook URL
 * @param {Array}  results - Array of quota result objects
 * @param {string} header  - Optional header text
 */
async function sendReport(url, results, header) {
    const platform = detectPlatform(url);
    let payload;

    if (platform === 'slack') {
        payload = buildSlackPayload(results, header);
    } else if (platform === 'discord') {
        payload = buildDiscordPayload(results, header);
    } else {
        payload = {
            reportedAt: new Date().toISOString(),
            results
        };
    }

    await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
    });
}

module.exports = { sendThresholdAlert, sendReport, detectPlatform };
