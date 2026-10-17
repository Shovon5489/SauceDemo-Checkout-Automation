import { Browser, Builder, By, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import assert from "node:assert/strict";
import { resetAppState } from "./reset_app_state.js";
import { saveScreenshot } from "./screenshots.js";
import { logBox } from "./terminal_output.js";

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

export async function createAutomationSession() {
    const chromeOptions = new Options();
    chromeOptions.setUserPreferences({
        "credentials_enable_service": false,
        "profile.password_manager_enabled": false,
        "profile.password_manager_leak_detection": false,
    });

    const driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(chromeOptions)
        .build();
    let selectedProducts = [];
    let firstSortedProductName = "";
    let firstSortedProductPriceCents = 0;

    async function enterCheckoutInformation() {
        // Checkout information section
        await driver.wait(until.elementLocated(By.id("first-name")), 10000);
        await driver.findElement(By.id("first-name")).sendKeys("Nafis Fuad");
        await driver.findElement(By.id("last-name")).sendKeys("Shovon");
        await driver.findElement(By.id("postal-code")).sendKeys("1240");
        const continueButton = By.xpath("//input[@id='continue']");
        await driver.wait(until.elementLocated(continueButton), 10000);
        await driver.findElement(continueButton).click();
    }

    async function completeOrder() {
        // Finish order section
        const finishButton = By.xpath("//button[@id='finish']");
        await driver.wait(until.elementLocated(finishButton), 10000);
        await driver.findElement(finishButton).click();

        // Verify successful order message
        const confirmation = By.xpath("//h2[text()='Thank you for your order!']");
        const message = await driver.wait(until.elementLocated(confirmation), 10000).getText();
        assert.equal(message, "Thank you for your order!");
        logBox(`Order confirmation verified: ${message}`);
    }

    async function resetAndLogout() {
        // Menu button section
        await driver.findElement(By.xpath("//button[@id='react-burger-menu-btn']")).click();
        await driver.sleep(3000);

        // Reset App State section
        const resetLink = By.xpath("//a[@data-test='reset-sidebar-link']");
        await driver.wait(until.elementIsVisible(driver.findElement(resetLink)), 10000);
        await driver.findElement(resetLink).click();
        await driver.sleep(3000);

        // Logout section
        const logoutLink = By.xpath("//a[text()='Logout']");
        await driver.wait(until.elementIsVisible(driver.findElement(logoutLink)), 10000);
        await driver.findElement(logoutLink).click();
    }

    return {
        driver,

        async verifyLockedOutLogin() {
            await driver.get("https://www.saucedemo.com/");
            await driver.manage().window().maximize();

            // Login section
            await saveScreenshot(driver, "Before-login");
            await driver.findElement(By.id("user-name")).sendKeys("locked_out_user");
            await driver.findElement(By.id("password")).sendKeys("secret_sauce");
            await driver.findElement(By.id("login-button")).click();

            // Error message assertion section
            const error = await driver.wait(
                until.elementLocated(By.css("[data-test='error']")),
                10000
            ).getText();
            assert.equal(error, "Epic sadface: Sorry, this user has been locked out.");
            await saveScreenshot(driver, "Failed-login");
            logBox("Assertion passed: actual error message matches expected result.");
        },

        async loginStandardUserAndReset() {
            // Open SauceDemo and log in with standard_user
            await driver.get("https://www.saucedemo.com/");
            await driver.manage().window().maximize();
            await driver.wait(until.elementLocated(By.id("user-name")), 10000);
            await driver.findElement(By.id("user-name")).sendKeys("standard_user");
            await driver.findElement(By.id("password")).sendKeys("secret_sauce");
            await driver.findElement(By.id("login-button")).click();
            await driver.wait(
                until.elementLocated(By.css("[data-test='inventory-container']")),
                10000
            );
            await saveScreenshot(driver, "After-login");

            // Reset App State after standard_user login
            await resetAppState(driver);
        },

        async addRandomProductsToCart() {
            // Random product selection and add-to-cart section
            selectedProducts = await getRandomProductsFromInventory(driver, 3);
            for (const product of selectedProducts) {
                const productLocator = By.xpath(
                    `//a[div[contains(text(), '${product.name}')]]`
                );
                await driver.wait(until.elementLocated(productLocator), 10000);
                await driver.findElement(productLocator).click();
                const addToCartButton = By.xpath(
                    "//button[normalize-space()='Add to cart']"
                );
                await driver.wait(until.elementLocated(addToCartButton), 10000);
                await driver.findElement(addToCartButton).click();
                logBox(`Added to cart: ${product.name} ($${product.price.toFixed(2)})`);
                const backButton = By.xpath("//button[text()='Back to products']");
                await driver.wait(until.elementLocated(backButton), 10000);
                await driver.findElement(backButton).click();
            }
        },

        async verifyStandardCheckout() {
            // Shopping cart section
            const cartLink = By.xpath("//a[@data-test='shopping-cart-link']");
            await driver.wait(until.elementLocated(cartLink), 10000);
            await driver.findElement(cartLink).click();

            // Checkout section
            const checkoutButton = By.xpath("//button[text()='Checkout']");
            await driver.wait(until.elementLocated(checkoutButton), 10000);
            await driver.findElement(checkoutButton).click();
            await enterCheckoutInformation();

            // Verify selected products are visible on the checkout overview
            const missingProducts = [];
            for (const product of selectedProducts) {
                const productLocator = By.xpath(
                    `//a[div[contains(text(), '${product.name}')]]`
                );
                const productElements = await driver.findElements(productLocator);
                let productIsVisible = false;
                for (const element of productElements) {
                    if (await element.isDisplayed()) {
                        productIsVisible = true;
                        break;
                    }
                }
                if (!productIsVisible) {
                    missingProducts.push(product.name);
                }
            }
            assert.deepEqual(missingProducts, [], "Some selected products are missing from checkout.");
            logBox(
                `All ${selectedProducts.length} selected products are visible on the checkout page.`
            );

            // Validate selected product subtotal and checkout total
            const expectedSubtotalCents = selectedProducts.reduce(
                (sum, product) => sum + Math.round(product.price * 100),
                0
            );
            const subtotalText = await driver.findElement(
                By.css("[data-test='subtotal-label']")
            ).getText();
            const taxText = await driver.findElement(By.css("[data-test='tax-label']")).getText();
            const totalText = await driver.findElement(By.css("[data-test='total-label']")).getText();
            const actualSubtotalCents = moneyTextToCents(subtotalText);
            const actualTaxCents = moneyTextToCents(taxText);
            const actualTotalCents = moneyTextToCents(totalText);
            const expectedTotalCents = actualSubtotalCents + actualTaxCents;

            assert.equal(actualSubtotalCents, expectedSubtotalCents, "Checkout subtotal does not match.");
            assert.equal(actualTotalCents, expectedTotalCents, "Checkout total does not equal subtotal plus tax.");
            logBox(
                `Amount matched: subtotal is $${(expectedSubtotalCents / 100).toFixed(2)} ` +
                `and checkout total is $${(actualTotalCents / 100).toFixed(2)} (including tax).`
            );
        },

        async completeStandardOrder() {
            await completeOrder();
        },

        async resetStandardUserAppStateAndLogout() {
            await resetAndLogout();
        },

        async loginPerformanceUserSortAndAddFirstProduct() {
            // Open SauceDemo and log in with the requested user
            await driver.get("https://www.saucedemo.com/");
            await driver.manage().window().maximize();
            await driver.wait(until.elementLocated(By.id("user-name")), 10000);
            await driver.findElement(By.id("user-name"))
                .sendKeys("performance_glitch_user");
            await driver.findElement(By.id("password")).sendKeys("secret_sauce");
            await driver.findElement(By.id("login-button")).click();
            await driver.wait(
                until.elementLocated(By.css("[data-test='inventory-container']")),
                30000
            );

            // Reset App State and close the menu after logging back in
            await resetAppState(driver);

            // Sort products by name in descending order
            const sortDropdown = By.css("select[data-test='product-sort-container']");
            await driver.wait(until.elementLocated(sortDropdown), 10000);
            await driver.findElement(sortDropdown).click();
            const descendingOption = By.xpath(
                "//select[@data-test='product-sort-container']/option[normalize-space()='Name (Z to A)']"
            );
            await driver.wait(until.elementLocated(descendingOption), 10000);
            await driver.findElement(descendingOption).click();
            assert.equal(await driver.findElement(sortDropdown).getAttribute("value"), "za");

            const items = await driver.wait(
                until.elementsLocated(By.css("[data-test='inventory-item']")),
                10000
            );
            const firstProduct = items[0];
            firstSortedProductName = await firstProduct
                .findElement(By.css("[data-test='inventory-item-name']"))
                .getText();
            const priceText = await firstProduct
                .findElement(By.css("[data-test='inventory-item-price']"))
                .getText();
            firstSortedProductPriceCents = moneyTextToCents(priceText);
            await firstProduct
                .findElement(By.xpath(".//button[normalize-space()='Add to cart']"))
                .click();
            logBox(`Added first Z-A product to cart: ${firstSortedProductName}`);
        },

        async verifyPerformanceCheckoutProduct() {
            // Open the cart and start checkout for the newly added product
            const cartLink = By.xpath("//a[@data-test='shopping-cart-link']");
            await driver.wait(until.elementLocated(cartLink), 10000);
            await driver.findElement(cartLink).click();
            const checkoutButton = By.xpath("//button[text()='Checkout']");
            await driver.wait(until.elementLocated(checkoutButton), 10000);
            await driver.findElement(checkoutButton).click();

            // Enter the same checkout details and continue
            await enterCheckoutInformation();

            // Verify the first Z-A product is visible in the relogin checkout overview
            const productLocator = By.xpath(
                `//a[div[contains(text(), '${firstSortedProductName}')]]`
            );
            const checkoutProduct = await driver.wait(
                until.elementLocated(productLocator),
                10000
            );
            assert.ok(
                await checkoutProduct.isDisplayed(),
                `Checkout product is not visible: ${firstSortedProductName}`
            );
            logBox(
                `Product successfully visible; product name verified: ${firstSortedProductName}`
            );

            // Validate the checkout price against the price captured from inventory
            const checkoutItems = await driver.wait(
                until.elementsLocated(By.css("[data-test='inventory-item']")),
                10000
            );
            let checkoutPriceText;
            for (const item of checkoutItems) {
                const name = await item
                    .findElement(By.css("[data-test='inventory-item-name']"))
                    .getText();
                if (name === firstSortedProductName) {
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
            logBox(
                `Product price verified: ${firstSortedProductName} ` +
                `($${(checkoutPriceCents / 100).toFixed(2)})`
            );
        },

        async completePerformanceOrderAndLogout() {
            await completeOrder();
            await resetAndLogout();
        },

        async quit() {
            await driver.quit();
        },
    };
}
