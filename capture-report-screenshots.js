import { Browser, Builder, By, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { saveScreenshot } from "./screenshots.js";

// Allure report server setup section
const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const reportDirectory = path.join(projectDirectory, "allure-report");
const contentTypes = new Map([
    [".css", "text/css"],
    [".html", "text/html"],
    [".ico", "image/x-icon"],
    [".jpg", "image/jpeg"],
    [".js", "text/javascript"],
    [".json", "application/json"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
]);
const server = createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filePath = path.resolve(reportDirectory, `.${requestPath}`);
    const relativePath = path.relative(reportDirectory, filePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        response.writeHead(403).end("Forbidden");
        return;
    }

    response.setHeader(
        "Content-Type",
        contentTypes.get(path.extname(filePath)) ?? "application/octet-stream"
    );
    const file = createReadStream(filePath);
    file.on("error", (error) => {
        if (!response.headersSent) {
            response.writeHead(error.code === "ENOENT" ? 404 : 500);
        }
        response.end(error.code === "ENOENT" ? "Not found" : "Could not read report file");
    });
    file.pipe(response);
});
await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
if (!address || typeof address === "string") {
    throw new Error("Could not determine the local Allure report server address.");
}
const reportUrl = `http://127.0.0.1:${address.port}/index.html`;
const chromeOptions = new Options();
chromeOptions.addArguments("--headless=new");
chromeOptions.addArguments("--window-size=1600,1200");

// Report browser setup section
const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .build();

// Allure report screenshots section
try {
    await driver.get(reportUrl);
    await driver.wait(
        until.elementLocated(By.xpath("//h2[contains(., 'Allure Report')]")),
        15000
    );
    await saveScreenshot(driver, "Allure-report", "jpeg");

    await driver.findElement(By.css("a[href='#graph']")).click();
    await driver.wait(
        until.elementLocated(By.xpath("//h2[normalize-space()='Status']")),
        10000
    );
    await saveScreenshot(driver, "Graphs", "jpeg");
} finally {
    try {
        await driver.quit();
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}
