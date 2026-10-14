import { Browser, Builder, By, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import assert from "node:assert/strict";
import { resetAppState } from "./reset_app_state.js";

const chromeOptions = new Options();
chromeOptions.setUserPreferences({
    "credentials_enable_service": false,
    "profile.password_manager_enabled": false,
    "profile.password_manager_leak_detection": false,
});
const driverPromise = new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .build();

function moneyTextToCents(text) {
    const amount = text.match(/(\d[\d,]*\.\d{2})/);
    if (!amount) {
        throw new Error(`Could not read a dollar amount from: ${text}`);
    }

    return Math.round(Number(amount[1].replaceAll(",", "")) * 100);
}

async function getRandomProductsFromInventory(driver, count) {
    const inventoryItems = await driver.wait(
        until.elementsLocated(By.css("[data-test='inventory-item']")),
        10000
    );
    const products = await Promise.all(inventoryItems.map(async (item) => {
        const name = await item.findElement(By.css("[data-test='inventory-item-name']")).getText();
        const priceText = await item.findElement(By.css("[data-test='inventory-item-price']")).getText();
        const price = Number(priceText.replace("$", ""));

        if (!Number.isFinite(price)) {
            throw new Error(`Could not read a product price from: ${priceText}`);
        }

        return { name, price };
    }));

    if (!Number.isInteger(count) || count < 0 || count > products.length) {
        throw new RangeError(`count must be an integer between 0 and ${products.length}.`);
    }

    const shuffledProducts = [...products];
    for (let index = shuffledProducts.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledProducts[index], shuffledProducts[randomIndex]] =
            [shuffledProducts[randomIndex], shuffledProducts[index]];
    }

    return shuffledProducts.slice(0, count);
}

async function runner() {
    const driver = await driverPromise;
    await driver.get("https://www.saucedemo.com/");
    await driver.manage().window().maximize();

    // Login section
    await driver.findElement(By.xpath("//input[@id='user-name' and @name='user-name']"))
        .sendKeys("locked_out_user");
    await driver.findElement(By.xpath("//input[@id='password' and @name='password']"))
        .sendKeys("secret_sauce");
    await driver.findElement(By.xpath("//input[@id='login-button' and @name='login-button']"))
        .click();
    await driver.sleep(3000);

    // Error message assertion section
    const actualResult = await driver.findElement(
        By.xpath("//h3[@data-test='error']")
    ).getText();
    const expectedResult = "Epic sadface: Sorry, this user has been locked out.";
    assert.equal(actualResult, expectedResult);
    console.log("Assertion passed: actual error message matches expected result.");
    await driver.sleep(3000);

    // Login again with standard_user
    const usernameField = driver.findElement(
        By.xpath("//input[@id='user-name' and @name='user-name']")
    );
    const passwordField = driver.findElement(
        By.xpath("//input[@id='password' and @name='password']")
    );
    await usernameField.clear();
    await usernameField.sendKeys("standard_user");
    await passwordField.clear();
    await passwordField.sendKeys("secret_sauce");
    await driver.findElement(By.xpath("//input[@id='login-button' and @name='login-button']")).click();
    await driver.sleep(3000);

    // Reset App State after standard_user login
    await resetAppState(driver);

    // Random product selection and add-to-cart section
    const selectedProducts = await getRandomProductsFromInventory(driver, 3);
    for (const product of selectedProducts) {
        const productLocator = By.xpath(`//a[div[contains(text(), '${product.name}')]]`);
        await driver.wait(until.elementLocated(productLocator), 10000);
        await driver.findElement(productLocator).click();
        await driver.sleep(3000);

        const addToCartLocator = By.xpath("//button[normalize-space()='Add to cart']");
        await driver.wait(until.elementLocated(addToCartLocator), 10000);
        await driver.findElement(addToCartLocator).click();
        console.log(`Added to cart: ${product.name} ($${product.price.toFixed(2)})`);
        await driver.sleep(3000);

        const backToProductsLocator = By.xpath("//button[text()='Back to products']");
        await driver.wait(until.elementLocated(backToProductsLocator), 10000);
        await driver.findElement(backToProductsLocator).click();
        await driver.sleep(3000);
    }

    // Shopping cart section
    const shoppingCartLocator = By.xpath("//a[@data-test='shopping-cart-link']");
    await driver.wait(until.elementLocated(shoppingCartLocator), 10000);
    await driver.findElement(shoppingCartLocator).click();
    await driver.sleep(3000);

    // Checkout section
    const checkoutLocator = By.xpath("//button[text()='Checkout']");
    await driver.wait(until.elementLocated(checkoutLocator), 10000);
    await driver.findElement(checkoutLocator).click();
    await driver.sleep(3000);

    // Checkout information section
    await driver.findElement(By.id("first-name")).sendKeys("Nafis Fuad");
    await driver.findElement(By.id("last-name")).sendKeys("Shovon");
    await driver.findElement(By.id("postal-code")).sendKeys("1240");
    await driver.findElement(By.xpath("//input[@id='continue']")).click();
    await driver.sleep(3000);

    // Verify selected products are visible on the checkout overview
    const missingProducts = [];
    for (const product of selectedProducts) {
        const productLocator = By.xpath(`//a[div[contains(text(), '${product.name}')]]`);
        const productElements = await driver.findElements(productLocator);
        let productIsVisible = false;

        for (const productElement of productElements) {
            if (await productElement.isDisplayed()) {
                productIsVisible = true;
                break;
            }
        }

        if (!productIsVisible) {
            missingProducts.push(product.name);
        }
    }

    if (missingProducts.length === 0) {
        console.log(`All ${selectedProducts.length} selected products are visible on the checkout page.`);
    } else {
        console.warn(
            `Not all ${selectedProducts.length} selected products are visible on the checkout page. ` +
            `Missing: ${missingProducts.join(", ")}`
        );
    }
    await driver.sleep(3000);

    // Validate selected product subtotal and checkout total
    const expectedSubtotalCents = selectedProducts.reduce(
        (sum, product) => sum + Math.round(product.price * 100),
        0
    );
    const subtotalElement = await driver.wait(
        until.elementLocated(By.css("[data-test='subtotal-label']")),
        10000
    );
    const subtotalText = await subtotalElement.getText();
    const taxText = await driver.findElement(By.css("[data-test='tax-label']")).getText();
    const totalText = await driver.findElement(By.css("[data-test='total-label']")).getText();

    const actualSubtotalCents = moneyTextToCents(subtotalText);
    const actualTaxCents = moneyTextToCents(taxText);
    const actualTotalCents = moneyTextToCents(totalText);
    const expectedTotalCents = actualSubtotalCents + actualTaxCents;
    const subtotalMatches = actualSubtotalCents === expectedSubtotalCents;
    const totalMatches = actualTotalCents === expectedTotalCents;

    if (subtotalMatches && totalMatches) {
        console.log(
            `Amount matched: selected products subtotal is $${(expectedSubtotalCents / 100).toFixed(2)} ` +
            `and checkout total is $${(actualTotalCents / 100).toFixed(2)} (including tax).`
        );
    } else {
        console.error(
            `Amount mismatch: expected subtotal $${(expectedSubtotalCents / 100).toFixed(2)}, ` +
            `page subtotal $${(actualSubtotalCents / 100).toFixed(2)}, ` +
            `and page total $${(actualTotalCents / 100).toFixed(2)} ` +
            `(subtotal plus tax should be $${(expectedTotalCents / 100).toFixed(2)}).`
        );
    }
    await driver.sleep(3000);

    // Finish order section
    const finishButton = By.xpath("//button[@id='finish']");
    await driver.wait(until.elementLocated(finishButton), 10000);
    await driver.findElement(finishButton).click();
    await driver.sleep(3000);

    // Verify successful order message
    const actualOrderMessage = await driver.findElement(
        By.xpath("//h2[text()='Thank you for your order!']")
    ).getText();
    const expectedOrderMessage = "Thank you for your order!";
    assert.equal(actualOrderMessage, expectedOrderMessage);
    console.log("Order confirmation verified: " + actualOrderMessage);

    // Menu button section
    await driver.findElement(By.xpath("//button[@id='react-burger-menu-btn']")).click();
    await driver.sleep(3000);

    // Reset App State section
    const resetAppStateLink = By.xpath("//a[@data-test='reset-sidebar-link']");
    await driver.wait(until.elementLocated(resetAppStateLink), 10000);
    await driver.findElement(resetAppStateLink).click();
    await driver.sleep(3000);

    // Logout section
    const logoutLink = By.xpath("//a[text()='Logout']");
    await driver.wait(until.elementLocated(logoutLink), 10000);
    await driver.findElement(logoutLink).click();
    await driver.sleep(3000);

    // Log back in with the requested user after logout
    await driver.wait(
        until.elementLocated(By.xpath("//input[@id='user-name' and @name='user-name']")),
        10000
    );
    await driver.findElement(By.xpath("//input[@id='user-name' and @name='user-name']"))
        .sendKeys("performance_glitch_user");
    await driver.findElement(By.xpath("//input[@id='password' and @name='password']"))
        .sendKeys("secret_sauce");
    await driver.findElement(By.xpath("//input[@id='login-button' and @name='login-button']"))
        .click();
    await driver.wait(
        until.elementLocated(By.css("[data-test='inventory-container']")),
        30000
    );

    // Reset App State and close the menu after logging back in
    await resetAppState(driver);

    // Sort products by name in descending order
    const productSortDropdown = By.css("select[data-test='product-sort-container']");
    await driver.wait(until.elementLocated(productSortDropdown), 10000);
    await driver.findElement(productSortDropdown).click();
    const nameDescendingOption = By.xpath(
        "//select[@data-test='product-sort-container']/option[normalize-space()='Name (Z to A)']"
    );
    await driver.wait(until.elementLocated(nameDescendingOption), 10000);
    await driver.findElement(nameDescendingOption).click();
    assert.equal(await driver.findElement(productSortDropdown).getAttribute("value"), "za");

    const sortedInventoryItems = await driver.wait(
        until.elementsLocated(By.css("[data-test='inventory-item']")),
        10000
    );
    const firstSortedProduct = sortedInventoryItems[0];
    const firstSortedProductName = await firstSortedProduct
        .findElement(By.css("[data-test='inventory-item-name']"))
        .getText();
    const firstSortedProductPriceText = await firstSortedProduct
        .findElement(By.css("[data-test='inventory-item-price']"))
        .getText();
    const firstSortedProductPriceCents = moneyTextToCents(firstSortedProductPriceText);
    await firstSortedProduct
        .findElement(By.xpath(".//button[normalize-space()='Add to cart']"))
        .click();
    console.log(`Added first Z-A product to cart: ${firstSortedProductName}`);

    // Open the cart and start checkout for the newly added product
    const reloginShoppingCartLocator = By.xpath("//a[@data-test='shopping-cart-link']");
    await driver.wait(until.elementLocated(reloginShoppingCartLocator), 10000);
    await driver.findElement(reloginShoppingCartLocator).click();

    const reloginCheckoutLocator = By.xpath("//button[text()='Checkout']");
    await driver.wait(until.elementLocated(reloginCheckoutLocator), 10000);
    await driver.findElement(reloginCheckoutLocator).click();

    // Enter the same checkout details and continue
    await driver.wait(until.elementLocated(By.id("first-name")), 10000);
    await driver.findElement(By.id("first-name")).sendKeys("Nafis Fuad");
    await driver.findElement(By.id("last-name")).sendKeys("Shovon");
    await driver.findElement(By.id("postal-code")).sendKeys("1240");
    const reloginContinueButton = By.xpath("//input[@id='continue']");
    await driver.wait(until.elementLocated(reloginContinueButton), 10000);
    await driver.findElement(reloginContinueButton).click();

    // Verify the first Z-A product is visible in the relogin checkout overview
    const reloginCheckoutProductLocator = By.xpath(
        `//a[div[contains(text(), '${firstSortedProductName}')]]`
    );
    const reloginCheckoutProduct = await driver.wait(
        until.elementLocated(reloginCheckoutProductLocator),
        10000
    );
    assert.ok(
        await reloginCheckoutProduct.isDisplayed(),
        `Checkout product is not visible: ${firstSortedProductName}`
    );
    console.log(
        `Product successfully visible; product name verified: ${firstSortedProductName}`
    );

    // Validate the checkout price against the price captured from inventory
    const reloginCheckoutItems = await driver.wait(
        until.elementsLocated(By.css("[data-test='inventory-item']")),
        10000
    );
    let checkoutPriceText;
    for (const item of reloginCheckoutItems) {
        const checkoutItemName = await item
            .findElement(By.css("[data-test='inventory-item-name']"))
            .getText();
        if (checkoutItemName === firstSortedProductName) {
            checkoutPriceText = await item
                .findElement(By.css("[data-test='inventory-item-price']"))
                .getText();
            break;
        }
    }

    assert.ok(
        checkoutPriceText,
        `Checkout price was not found for product: ${firstSortedProductName}`
    );
    const checkoutPriceCents = moneyTextToCents(checkoutPriceText);
    assert.equal(
        checkoutPriceCents,
        firstSortedProductPriceCents,
        `Checkout price does not match for product: ${firstSortedProductName}`
    );
    console.log(
        `Product price verified: ${firstSortedProductName} ` +
        `($${(checkoutPriceCents / 100).toFixed(2)})`
    );

    // Finish the relogin user's order
    const reloginFinishButton = By.xpath("//button[@id='finish']");
    await driver.wait(until.elementLocated(reloginFinishButton), 10000);
    await driver.findElement(reloginFinishButton).click();

    // Verify the relogin user's order confirmation
    const reloginOrderConfirmation = By.xpath("//h2[text()='Thank you for your order!']");
    const reloginOrderMessage = await driver.wait(
        until.elementLocated(reloginOrderConfirmation),
        10000
    ).getText();
    assert.equal(reloginOrderMessage, "Thank you for your order!");
    console.log(`Order confirmation verified: ${reloginOrderMessage}`);

    // Menu button section
    await driver.findElement(By.xpath("//button[@id='react-burger-menu-btn']")).click();
    await driver.sleep(3000);

    // Reset App State section
    const reloginResetAppStateLink = By.xpath("//a[@data-test='reset-sidebar-link']");
    await driver.wait(until.elementLocated(reloginResetAppStateLink), 10000);
    await driver.findElement(reloginResetAppStateLink).click();
    await driver.sleep(3000);

    // Logout section
    const reloginLogoutLink = By.xpath("//a[text()='Logout']");
    await driver.wait(until.elementLocated(reloginLogoutLink), 10000);
    await driver.findElement(reloginLogoutLink).click();
    await driver.sleep(3000);

    await driver.quit();
}

runner();