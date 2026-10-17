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

The automation is organized into three independent end-to-end scenarios containing nine Mocha test cases total (one locked-out login, five standard-user checkout steps, and three performance-user checkout steps). The standard-user order confirmation and app reset/logout are reported as separate test cases. Each scenario starts and closes its own Chrome session, so it can run by itself or as part of the full sequential suite. Allure reports all nine test cases, grouped under their scenario.

## Sample Manual Test Cases

These cases describe the main checks in the project. They are covered by three end-to-end scenarios that can be run together or individually.

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
├── automation.test.js   # Three scenarios containing nine Mocha test cases
├── main_body.js         # End-to-end Selenium checkout automation
├── package.json         # Project dependencies
├── SauceDemo_Test_Cases.xlsx # Editable test-case workbook and status dashboard
├── reset_app_state.js   # Reusable reset-app-state/menu-close function
├── run-tests.js         # Runs Mocha and generates an Allure HTML report after every run
├── Screenshots/         # Login-state and Allure report evidence images
│   ├── Before-login.png
│   ├── Failed-login.png
│   ├── After-login.png
│   ├── Allure-report.jpg
│   └── Graphs.jpg
├── screenshots.js       # Shared browser screenshot helper
├── capture-report-screenshots.js # Captures the generated Allure overview and graphs
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

Run all three scenarios sequentially:

```bash
npm test
```

In VS Code, open this project folder, then use the editor's **Run Code** button while `automation.test.js` is open. The project Code Runner setting maps that file to `npm test` instead of running it directly with Node, and the runner ignores the redundant test-file path that Code Runner may append. This requires the **Code Runner** extension.

Run one scenario independently:

```bash
npm run test:locked-out
npm run test:standard
npm run test:performance
```

Each command starts a fresh Chrome session for each selected scenario. `npm test` runs all three scenarios sequentially, each in its own session, and records nine individual Mocha test cases in Allure. After every run, including a run with a failing test, the runner generates an Allure HTML report in `allure-report/`, keeps the raw results in `allure-results/`, and refreshes the Allure overview and graphs screenshots in `Screenshots/`. The login scenario also captures the login form and locked-out error; the standard-user scenario captures the inventory page after login. Open the latest report with:

Key verification results, selected products, saved screenshots, and report generation are printed in bordered `PASS` boxes in the terminal. Chrome and WebDriver diagnostic messages may still appear outside those boxes.

```bash
npm run allure:open
```

The runner clears previous raw results before execution, so the report contains only the scenarios from the latest run. Selenium Manager may download a compatible ChromeDriver if one is not already available. The Allure CLI requires Java 8 or later.

## Test Flow

1. **Locked-out login:** Open SauceDemo, attempt to log in as `locked_out_user`, and assert the expected error.
2. **Standard-user checkout:** Log in as `standard_user`, reset app state, add three distinct products, verify checkout contents and totals, complete the order, and log out.
3. **Performance-user checkout:** Log in as `performance_glitch_user`, reset app state, sort by **Name (Z to A)**, add the first listed product, verify its name and price at checkout, complete the order, and log out.

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

The project uses three Chrome-based Selenium scenarios under Mocha; it does not include Cucumber features, a Page Object Model, or cross-browser execution.

## Final Thoughts

This project demonstrates three independently runnable SauceDemo checkout scenarios using JavaScript, Selenium WebDriver, Mocha, and Allure. The scenarios can also run sequentially as a full suite, and each execution automatically generates an HTML report.
