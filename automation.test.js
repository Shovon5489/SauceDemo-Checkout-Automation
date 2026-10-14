import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "mocha";

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const automationScript = join(projectDirectory, "main_body.js");

describe("SauceDemo checkout automation", function () {
    this.timeout(10 * 60 * 1000);

    it("completes login, cart, checkout, and order flows", function () {
        return new Promise((resolve, reject) => {
            execFile(
                process.execPath,
                [automationScript],
                {
                    cwd: projectDirectory,
                    maxBuffer: 10 * 1024 * 1024,
                },
                (error, stdout, stderr) => {
                    if (stdout) {
                        process.stdout.write(stdout);
                    }
                    if (stderr) {
                        process.stderr.write(stderr);
                    }
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                }
            );
        });
    });
});
