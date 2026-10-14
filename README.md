# SauceDemo Checkout Automation

A browser automation project for validating key login, product, cart, and checkout flows on [SauceDemo](https://www.saucedemo.com/). It uses JavaScript, Selenium WebDriver, and Chrome, with standalone Axios utilities for retrieving SauceDemo product data.

## Features

- Verifies the locked-out user error message.
- Logs in as `standard_user`, resets app state, and adds three randomly selected inventory products to the cart.
- Checks that selected products appear in the checkout overview and compares the expected subtotal and total.
- Completes checkout and verifies the order confirmation.
- Logs out, signs in as `performance_glitch_user`, and sorts inventory by **Name (Z to A)**.
- Adds the first product in the sorted inventory to the cart, checks its name and price on the checkout overview, and completes the order.
- Reuses a helper to reset app state and close the hamburger menu.
- Provides Axios helpers to retrieve product names and prices from SauceDemo's JavaScript bundle.

## Tech Stack

| Component | Technology |
| --- | --- |
| Language | JavaScript (ES modules) |
| Browser automation | Selenium WebDriver |
| Browser | Google Chrome |
| HTTP client | Axios |
| Test runner and reporting | Mocha and Allure |

## Test Coverage Overview

The current automation is a sequential end-to-end browser flow in `main_body.js`; the checks below are automated in that run.

| Area | Automated coverage |
| --- | --- |
| Login | Confirms `locked_out_user` displays the expected error; signs in with `standard_user` and `performance_glitch_user`. |
| Product browsing | Randomly selects three inventory products for the standard-user flow; sorts the second user's inventory by **Name (Z to A)**. |
| Cart management | Adds selected products to the cart and proceeds through checkout; adds the first Z-A product in the second flow. |
| Checkout contents | Checks that selected products appear in the checkout overview and verifies the second flow's product name is visible. |
| Price and totals | Compares the first flow's expected subtotal and total; compares the second flow's product price with its inventory price. |
| Order confirmation | Completes both checkout flows and asserts the **Thank you for your order!** confirmation. |
| App state and logout | Resets app state and logs out as part of the flow. |

The browser scenarios run sequentially in one shared Chrome session as separate Mocha tests, with an individual Allure result for each scenario. The project does not include a separate unit-test suite or cross-browser test configuration.

## Sample Manual Test Cases

These cases describe the main checks in the project. The current Selenium script runs them together as an end-to-end flow rather than as separately selectable tests.

| ID | Test case | Type | Steps | Expected result |
| --- | --- | --- | --- | --- |
| SD-LOGIN-01 | Locked-out user login | Negative / Functional | Open SauceDemo, enter `locked_out_user` and `secret_sauce`, then click Login. | The locked-out error message is displayed. |
| SD-LOGIN-02 | Standard user login | Functional | Sign in as `standard_user` with `secret_sauce`. | The inventory page opens. |
| SD-CART-01 | Add products to cart | Functional | Select three distinct products, open each product, and click **Add to cart**. | The selected products can be found in the cart and checkout overview. |
| SD-CHECKOUT-01 | Checkout totals | E2E / Validation | Continue from the cart, enter checkout information, and review the order. | The subtotal equals the selected product prices, and the total equals the subtotal plus tax. |
| SD-ORDER-01 | Order confirmation | E2E | Finish the checkout. | The page displays **Thank you for your order!** |
| SD-SORT-01 | Sort products by name descending | Functional | Sign in as `performance_glitch_user` and choose **Name (Z to A)**. | The sort control shows the Z-to-A selection and the first sorted item is available. |
| SD-CHECKOUT-02 | Verify sorted product in checkout | E2E / Validation | Add the first Z-to-A product, continue through checkout, and review the order. | The product name is visible and its checkout price matches its inventory price. |
| SD-RESET-01 | Reset app state and log out | Functional | Open the hamburger menu, select **Reset App State**, then select **Logout**. | The app state is reset and the user returns to the login page. |

An editable Excel workbook with these test cases, execution steps, expected results, and status tracking is available in [`SauceDemo_Test_Cases.xlsx`](./SauceDemo_Test_Cases.xlsx). Test statuses start as **Not executed** and can be updated from the dropdown; the summary counts update in Excel.

## Project Structure

```text
.
├── Api_call.js          # Axios functions for retrieving/parsing product data
├── automation.test.js   # Sequential Mocha scenarios with individual Allure results
├── main_body.js         # End-to-end Selenium checkout automation
├── package.json         # Project dependencies
├── SauceDemo_Test_Cases.xlsx # Editable test-case workbook and status dashboard
├── reset_app_state.js   # Reusable reset-app-state/menu-close function
└── README.md
```

## Prerequisites

- Node.js and npm
- Google Chrome installed
- Java 8 or later available on `PATH` (required by the Allure command-line report generator)
- Internet access to reach SauceDemo and download its product bundle

## Setup

Install the project dependencies from the project directory:

```bash
npm install
```

## Run the Automation and Generate an Allure Report

```bash
npm test
npm run allure:generate
npm run allure:open
```

`npm test` opens Chrome, runs eight sequential Mocha scenarios in one browser session, and writes a separate raw Allure result for each scenario to `allure-results/`. Old raw results are cleared before each test run. Generate the HTML report with `npm run allure:generate`, then open it with `npm run allure:open` (equivalent to `allure open allure-report`). Selenium Manager may download a compatible ChromeDriver if one is not already available. The Allure CLI requires Java 8 or later.

## Test Flow

1. Open SauceDemo and attempt to log in as `locked_out_user`.
2. Assert the expected locked-out error.
3. Log in as `standard_user`, reset the app state, and add three randomly selected products.
4. Open the cart, enter checkout details, verify the selected products, and check the subtotal and total.
5. Finish the order and verify **Thank you for your order!**
6. Reset app state, log out, and log in as `performance_glitch_user`.
7. Reset app state, select **Name (Z to A)**, and add the first listed product.
8. Continue through checkout using the same checkout details; verify the product name and compare its checkout price with its inventory price.
9. Finish the order, verify the confirmation message, reset app state, and log out.

The checkout information currently used by the script is:

- First name: `Nafis Fuad`
- Last name: `Shovon`
- Postal code: `1240`

## Product API Utilities

`Api_call.js` exports these functions:

- `getProducts()` — fetches and parses product names and numeric prices.
- `getProductNames()` — returns product names only.
- `getRandomProducts(count)` — returns a random, non-repeating selection with prices.
- `getRandomProductNames(count)` — returns random product names only.

Example:

```js
import { getRandomProducts } from "./Api_call.js";

const products = await getRandomProducts(3);
console.log(products);
```

The current browser flow reads the products used for its inventory steps directly from the page. The Axios utilities are available separately for callers that need product data from the bundle.

## App State Helper

`reset_app_state.js` exports `resetAppState(driver)`. It opens the hamburger menu, clicks **Reset App State**, and closes the menu. `main_body.js` calls this helper after the `standard_user` login and after the `performance_glitch_user` login.

## Interesting Additions

- **Random non-repeating product selection:** The standard-user flow shuffles inventory products and chooses three unique items.
- **Price checks in cents:** Checkout amounts are converted to integer cents before comparison to avoid floating-point rounding errors.
- **Reusable browser helper:** App-state reset and menu closing are kept in `reset_app_state.js` so the same steps can be called from the main flow.
- **Standalone product-data utilities:** `Api_call.js` uses Axios to retrieve product names and prices, independently of the browser-driven inventory selection.
- **Explicit Selenium waits:** The flow waits for key page elements before interacting with them, including the slower performance-glitch user's inventory.

The project currently runs as a single Chrome-based Selenium flow under Mocha; it does not include Cucumber features, a Page Object Model, cross-browser execution, or CI workflow configuration.

## Final Thoughts

This project demonstrates a practical SauceDemo checkout automation flow using JavaScript and Selenium WebDriver. It covers a locked-out login check, product selection and sorting, cart and checkout validation, order confirmation, and app-state reset. The modular reset helper and separate Axios utilities provide a straightforward base for adding independently runnable tests, richer reporting, or additional browser coverage later.
