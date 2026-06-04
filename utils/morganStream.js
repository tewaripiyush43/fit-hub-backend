const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../logs/local-requests.log');
const MAX_LINES = 100;

function writeLog(line) {
    if (process.env.NODE_ENV === 'production') return;

    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    let lines = [];

    if (fs.existsSync(LOG_FILE)) {
        lines = fs.readFileSync(LOG_FILE, 'utf8')
            .split('\n')
            .filter(Boolean);
    }

    lines.push(line.trim());

    if (lines.length > MAX_LINES) {
        lines = lines.slice(-MAX_LINES);
    }

    fs.writeFileSync(LOG_FILE, lines.join('\n') + '\n');
}

module.exports = {
    write(message) {
        // write to console
        process.stdout.write(message);

        // write to file
        writeLog(message);
    }
};
