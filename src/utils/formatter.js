const chalk = require('chalk');
const Table = require('cli-table3');

class Formatter {
    formatQuotaStatus(provider, data) {
        const percentage = (data.used / data.limit) * 100;

        let statusColor;
        let statusIcon;

        if (percentage >= 95) {
            statusColor = chalk.red;
            statusIcon = '🔴';
        } else if (percentage >= 80) {
            statusColor = chalk.yellow;
            statusIcon = '🟡';
        } else {
            statusColor = chalk.green;
            statusIcon = '🟢';
        }

        return {
            provider: chalk.bold(provider),
            status: `${statusIcon} ${statusColor(percentage.toFixed(1) + '%')}`,
            used: data.used.toLocaleString(),
            limit: data.limit.toLocaleString(),
            remaining: (data.limit - data.used).toLocaleString(),
            resets: data.resetsAt || 'N/A'
        };
    }

    createTable(data) {
        const table = new Table({
            head: ['Provider', 'Status', 'Used', 'Limit', 'Remaining', 'Resets'],
            style: {
                head: ['cyan', 'bold']
            }
        });

        data.forEach(row => {
            table.push([
                row.provider,
                row.status,
                row.used,
                row.limit,
                row.remaining,
                row.resets
            ]);
        });

        return table.toString();
    }

    formatProgressBar(percentage, width = 20) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;

        let color = chalk.green;
        if (percentage >= 95) color = chalk.red;
        else if (percentage >= 80) color = chalk.yellow;

        return color('█'.repeat(filled)) + '░'.repeat(empty);
    }
}

module.exports = new Formatter();
