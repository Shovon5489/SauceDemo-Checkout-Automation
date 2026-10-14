import { By, until } from "selenium-webdriver";

export async function resetAppState(driver) {
    await driver.findElement(By.xpath("//button[@id='react-burger-menu-btn']")).click();
    await driver.sleep(3000);

    const resetAppStateLink = By.xpath("//a[@data-test='reset-sidebar-link']");
    await driver.wait(until.elementLocated(resetAppStateLink), 10000);
    await driver.findElement(resetAppStateLink).click();
    await driver.sleep(3000);

    const closeMenuButton = By.xpath("//button[text()='Close Menu']");
    await driver.wait(until.elementLocated(closeMenuButton), 10000);
    await driver.findElement(closeMenuButton).click();
    await driver.sleep(3000);
}
