import { after, afterEach, before, describe, it } from "mocha";
import { createAutomationSession } from "./main_body.js";

// Independent scenario setup and cleanup section
function configureScenarioHooks(getSession, setSession) {
    before(async function () {
        this.timeout(10 * 60 * 1000);
        setSession(await createAutomationSession());
    });

    // Visible pause after each test case section
    afterEach(async function () {
        const session = getSession();
        if (session) {
            await session.driver.sleep(3000);
        }
    });

    after(async function () {
        const session = getSession();
        if (session) {
            await session.quit();
            setSession(undefined);
        }
    });
}

// Locked-out login scenario section
describe("Scenario 1: locked-out user login", function () {
    let session;
    this.timeout(10 * 60 * 1000);
    configureScenarioHooks(() => session, (value) => { session = value; });

    it("rejects login for the locked-out user", async function () {
        await session.verifyLockedOutLogin();
    });
});

// Standard-user checkout scenario section
describe("Scenario 2: standard_user checkout", function () {
    let session;
    this.timeout(10 * 60 * 1000);
    configureScenarioHooks(() => session, (value) => { session = value; });

    it("logs in as standard_user and resets app state", async function () {
        await session.loginStandardUserAndReset();
    });

    it("adds three distinct inventory products to the cart", async function () {
        await session.addRandomProductsToCart();
    });

    it("verifies checkout products, subtotal, and total", async function () {
        await session.verifyStandardCheckout();
    });

    // Standard-user order completion section
    it("completes the standard-user order", async function () {
        await session.completeStandardOrder();
    });

    // Standard-user app reset and logout section
    it("resets app state and logs out the standard user", async function () {
        await session.resetStandardUserAppStateAndLogout();
    });
});

// Performance-user checkout scenario section
describe("Scenario 3: performance_glitch_user checkout", function () {
    let session;
    this.timeout(10 * 60 * 1000);
    configureScenarioHooks(() => session, (value) => { session = value; });

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
