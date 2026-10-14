import { after, before, describe, it } from "mocha";
import { createAutomationSession } from "./main_body.js";

let session;

describe("SauceDemo checkout automation", function () {
    this.timeout(10 * 60 * 1000);

    before(async function () {
        session = await createAutomationSession();
    });

    after(async function () {
        if (session) {
            await session.quit();
        }
    });

    it("rejects login for the locked-out user", async function () {
        await session.verifyLockedOutLogin();
    });

    it("logs in as standard_user and resets app state", async function () {
        await session.loginStandardUserAndReset();
    });

    it("adds three distinct inventory products to the cart", async function () {
        await session.addRandomProductsToCart();
    });

    it("verifies checkout products, subtotal, and total", async function () {
        await session.verifyStandardCheckout();
    });

    it("completes the standard-user order and logs out", async function () {
        await session.completeStandardOrderAndLogout();
    });

    it("sorts performance_glitch_user inventory and adds the first Z-A product", async function () {
        await session.loginPerformanceUserSortAndAddFirstProduct();
    });

    it("verifies the first Z-A product name and price at checkout", async function () {
        await session.verifyPerformanceCheckoutProduct();
    });

    it("completes the performance-user order and logs out", async function () {
        await session.completePerformanceOrderAndLogout();
    });
});
