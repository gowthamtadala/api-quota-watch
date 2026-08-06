const chalk = require('chalk');
const Table = require('cli-table3');

class Formatter {
    // ─── Progress bar ────────────────────────────────────────────────────────

    formatProgressBar(percentage, width = 20, used, limit, unit) {
        const clamped = Math.min(100, Math.max(0, percentage));
        const filled  = Math.round((clamped / 100) * width);
        const empty   = width - filled;

        let color = chalk.green;
        if (clamped >= 95) color = chalk.red;
        else if (clamped >= 80) color = chalk.yellow;

        const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

        if (used !== undefined && limit !== undefined) {
            const usedStr  = typeof used  === 'number' ? used.toLocaleString()  : used;
            const limitStr = typeof limit === 'number' ? limit.toLocaleString() : limit;
            const unitStr  = unit ? ` ${unit}` : '';
            return `${bar} ${color(clamped.toFixed(1) + '%')} (${usedStr}/${limitStr}${unitStr})`;
        }

        return `${bar} ${color(clamped.toFixed(1) + '%')}`;
    }

    // ─── Quota status row (for table) ────────────────────────────────────────

    formatQuotaStatus(provider, data) {
        const percentage = data.limit > 0 ? (data.used / data.limit) * 100 : 0;

        let statusColor;
        let statusIcon;

        if (percentage >= 95) {
            statusColor = chalk.red;
            statusIcon  = '🔴';
        } else if (percentage >= 80) {
            statusColor = chalk.yellow;
            statusIcon  = '🟡';
        } else {
            statusColor = chalk.green;
            statusIcon  = '🟢';
        }

        return {
            provider: chalk.bold(provider),
            status:   `${statusIcon} ${statusColor(percentage.toFixed(1) + '%')}`,
            bar:      this.formatProgressBar(percentage, 16, data.used, data.limit, data.unit),
            used:     typeof data.used  === 'number' ? data.used.toLocaleString()  : String(data.used),
            limit:    typeof data.limit === 'number' ? data.limit.toLocaleString() : String(data.limit),
            unit:     data.unit || '',
            remaining: data.limit > 0
                ? (data.limit - data.used).toLocaleString()
                : 'N/A',
            resets:   data.resetsAt
                ? this._formatResetDate(data.resetsAt)
                : 'N/A',
            percentage
        };
    }

    _formatResetDate(isoString) {
        try {
            const d = new Date(isoString);
            const now = new Date();
            const diffMs = d - now;
            if (diffMs < 0) return 'now';

            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) return `in ${diffMins}m`;

            const diffHrs = Math.floor(diffMins / 60);
            if (diffHrs < 24) return `in ${diffHrs}h`;

            return d.toLocaleDateString();
        } catch {
            return isoString;
        }
    }

    // ─── Full table ──────────────────────────────────────────────────────────

    createTable(data) {
        const table = new Table({
            head: ['Provider', 'Usage', 'Used', 'Limit', 'Unit', 'Remaining', 'Resets'],
            style: { head: ['cyan', 'bold'] },
            colWidths: [12, 38, 12, 12, 16, 12, 12]
        });

        data.forEach(row => {
            table.push([
                row.provider,
                row.bar,
                row.used,
                row.limit,
                row.unit,
                row.remaining,
                row.resets
            ]);
        });

        return table.toString();
    }

    // ─── Summary line ────────────────────────────────────────────────────────

    formatSummary(results) {
        const healthy  = results.filter(r => r.percentage < 80).length;
        const warning  = results.filter(r => r.percentage >= 80 && r.percentage < 95).length;
        const critical = results.filter(r => r.percentage >= 95).length;

        const parts = [];
        if (healthy  > 0) parts.push(chalk.green(`🟢 ${healthy} healthy`));
        if (warning  > 0) parts.push(chalk.yellow(`🟡 ${warning} warning`));
        if (critical > 0) parts.push(chalk.red(`🔴 ${critical} critical`));

        return chalk.bold('Overall: ') + parts.join(chalk.gray(' · '));
    }

    // ─── Sparkline history chart ──────────────────────────────────────────────

    /**
     * Render an ASCII sparkline from an array of history entries.
     * Each entry should have { timestamp, used, limit }.
     */
    formatSparkline(history, width = 30) {
        if (!history || history.length === 0) {
            return chalk.gray('No history available yet.');
        }

        // Compute percentage for each point
        const points = history.map(h => {
            const pct = h.limit > 0 ? (h.used / h.limit) * 100 : 0;
            return { pct, timestamp: h.timestamp };
        });

        // Normalize to available width
        const sampled = this._sample(points, width);
        const BLOCKS  = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

        const sparkline = sampled.map(p => {
            const idx   = Math.min(7, Math.floor((p.pct / 100) * 8));
            const block = BLOCKS[idx];
            if (p.pct >= 95) return chalk.red(block);
            if (p.pct >= 80) return chalk.yellow(block);
            return chalk.green(block);
        }).join('');

        // Stats
        const pcts    = points.map(p => p.pct);
        const minPct  = Math.min(...pcts);
        const maxPct  = Math.max(...pcts);
        const avgPct  = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        const first   = pcts[0];
        const last    = pcts[pcts.length - 1];
        const trendIcon = last > first + 2 ? chalk.red('↑') : last < first - 2 ? chalk.green('↓') : chalk.gray('→');

        const stats = chalk.gray(
            `min ${minPct.toFixed(1)}%  avg ${avgPct.toFixed(1)}%  max ${maxPct.toFixed(1)}%  trend ${trendIcon}`
        );

        // Date range
        const firstDate = new Date(points[0].timestamp).toLocaleDateString();
        const lastDate  = new Date(points[points.length - 1].timestamp).toLocaleDateString();
        const dateRange = chalk.gray(`${firstDate} → ${lastDate}`);

        return `${sparkline}\n  ${stats}\n  ${dateRange}`;
    }

    _sample(arr, n) {
        if (arr.length <= n) return arr;
        const step = (arr.length - 1) / (n - 1);
        return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
    }

    // ─── Burn rate ───────────────────────────────────────────────────────────

    /**
     * Given history entries and current used/limit, estimate days until limit.
     * Returns a formatted string.
     */
    formatBurnRate(history, used, limit) {
        if (!history || history.length < 2 || limit === 0) return null;

        const recent = history.slice(-7); // last 7 readings
        const oldest = recent[0];
        const newest = recent[recent.length - 1];

        const deltaUsed = newest.used - oldest.used;
        const deltaMs   = new Date(newest.timestamp) - new Date(oldest.timestamp);
        const deltaDays = deltaMs / (1000 * 60 * 60 * 24);

        if (deltaUsed <= 0 || deltaDays <= 0) return null;

        const dailyRate   = deltaUsed / deltaDays;
        const remaining   = limit - used;
        const daysLeft    = remaining / dailyRate;

        if (daysLeft > 90) return null; // not useful to show

        const color = daysLeft <= 3 ? chalk.red : daysLeft <= 7 ? chalk.yellow : chalk.cyan;
        return color(`⚡ At current pace: limit in ~${Math.ceil(daysLeft)} day${daysLeft !== 1 ? 's' : ''}`);
    }

    // ─── Report serializer ───────────────────────────────────────────────────

    serializeReport(reportData, format = 'json') {
        if (format === 'csv') {
            const headers = ['provider', 'alias', 'usedPercent', 'used', 'limit', 'unit', 'resetsAt', 'reportedAt'];
            const rows = reportData.apis.map(a => [
                a.provider,
                a.alias || '',
                a.usedPercent.toFixed(2),
                a.used,
                a.limit,
                a.unit,
                a.resetsAt || '',
                reportData.reportedAt
            ]);
            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }

        return JSON.stringify(reportData, null, 2);
    }
}

module.exports = new Formatter();
