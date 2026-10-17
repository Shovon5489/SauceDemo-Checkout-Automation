import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logBox } from "./terminal_output.js";

// Screenshot output setup section
const screenshotsDirectory = fileURLToPath(new URL("./Screenshots/", import.meta.url));

// Screenshot capture section
export async function saveScreenshot(driver, filename, format = "png") {
    if (!["png", "jpeg"].includes(format)) {
        throw new RangeError(`Unsupported screenshot format: ${format}`);
    }

    await mkdir(screenshotsDirectory, { recursive: true });
    const captureOptions = { format, captureBeyondViewport: true };
    if (format === "jpeg") {
        captureOptions.quality = 90;
    }

    const screenshot = await driver.sendAndGetDevToolsCommand(
        "Page.captureScreenshot",
        captureOptions
    );
    const extension = format === "jpeg" ? "jpg" : "png";
    const outputPath = path.join(screenshotsDirectory, `${filename}.${extension}`);
    await writeFile(outputPath, Buffer.from(screenshot.data, "base64"));
    logBox(`Screenshot saved: ${path.relative(process.cwd(), outputPath)}`);
}
