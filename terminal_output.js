// Boxed terminal output section
const boxWidth = 78;

export function logBox(message) {
    const contentWidth = boxWidth - 4;
    const words = `PASS | ${message}`.split(/\s+/);
    const lines = [];
    let line = "";

    for (const word of words) {
        if (line && line.length + word.length + 1 > contentWidth) {
            lines.push(line);
            line = "";
        }
        line = line ? `${line} ${word}` : word;
    }
    if (line) {
        lines.push(line);
    }

    const border = `+${"-".repeat(boxWidth - 2)}+`;
    console.log(border);
    for (const outputLine of lines) {
        console.log(`| ${outputLine.padEnd(contentWidth)} |`);
    }
    console.log(border);
}
