import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logBox } from "./terminal_output.js";

// Test runner setup section
const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const mochaCli = path.join(projectDirectory, "node_modules", "mocha", "bin", "mocha.js");
const allureCli = path.join(
    projectDirectory,
    "node_modules",
    "allure-commandline",
    "bin",
    "allure"
);

// Normalize Code Runner arguments section
const suppliedArguments = process.argv.slice(2);
const mochaArguments = [];
for (let index = 0; index < suppliedArguments.length;) {
    if (suppliedArguments[index].startsWith("-")) {
        mochaArguments.push(suppliedArguments[index]);
        index++;
        continue;
    }

    const groupStart = index;
    while (index < suppliedArguments.length && !suppliedArguments[index].startsWith("-")) {
        index++;
    }
    const argumentGroup = suppliedArguments.slice(groupStart, index);
    const requestedFile = path.resolve(projectDirectory, argumentGroup.join(" "));
    const automationTestFile = path.join(projectDirectory, "automation.test.js");
    if (requestedFile.toLowerCase() !== automationTestFile.toLowerCase()) {
        mochaArguments.push(...argumentGroup);
    }
}

// Execute selected Mocha scenarios section
const resultsDirectory = path.join(projectDirectory, "allure-results");
rmSync(resultsDirectory, { recursive: true, force: true });
mkdirSync(resultsDirectory, { recursive: true });
const testRun = spawnSync(
    process.execPath,
    [
        mochaCli,
        "--reporter",
        "allure-mocha",
        "--reporter-option",
        "resultsDir=allure-results",
        "automation.test.js",
        ...mochaArguments,
    ],
    { cwd: projectDirectory, stdio: "inherit" }
);

// Generate the HTML Allure report section
const reportRun = spawnSync(
    process.execPath,
    [allureCli, "generate", "allure-results", "--clean", "-o", "allure-report"],
    { cwd: projectDirectory, encoding: "utf8" }
);
if (reportRun.status === 0) {
    logBox("Allure HTML report generated: allure-report");
} else {
    process.stdout.write(reportRun.stdout ?? "");
    process.stderr.write(reportRun.stderr ?? "");
}
const screenshotRun = reportRun.status === 0
    ? spawnSync(
        process.execPath,
        [path.join(projectDirectory, "capture-report-screenshots.js")],
        { cwd: projectDirectory, stdio: "inherit" }
    )
    : null;

if (testRun.error) {
    console.error(`Could not run Mocha: ${testRun.error.message}`);
}
if (reportRun.error) {
    console.error(`Could not generate the Allure report: ${reportRun.error.message}`);
}
if (screenshotRun?.error) {
    console.error(`Could not capture Allure report screenshots: ${screenshotRun.error.message}`);
}

const testExitCode = testRun.status ?? 1;
const reportExitCode = reportRun.status ?? 1;
const screenshotExitCode = screenshotRun ? (screenshotRun.status ?? 1) : 0;
process.exitCode = testExitCode || reportExitCode || screenshotExitCode;
