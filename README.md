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

The script currently exercises these scenarios in Chrome as one run. It does not define a separate unit-test suite or cross-browser test configuration.

## Project Structure

```text
.
├── Api_call.js          # Axios functions for retrieving/parsing product data
├── main_body.js         # End-to-end Selenium checkout automation
├── package.json         # Project dependencies
├── reset_app_state.js   # Reusable reset-app-state/menu-close function
└── README.md
```

## Prerequisites

- Node.js and npm
- Google Chrome installed
- Internet access to reach SauceDemo and download its product bundle

## Setup

Install the project dependencies from the project directory:

```bash
npm install
```

## Run the Automation

```bash
node main_body.js
```

The script opens Chrome and runs the browser flow. Selenium Manager may download a compatible ChromeDriver if one is not already available.

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
