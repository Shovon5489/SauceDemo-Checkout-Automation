import axios from "axios";

// URL of SauceDemo's JavaScript bundle, which contains the product data.
const apiUrl = "https://www.saucedemo.com/assets/index-D3OxT1jE.js";

// Fetches the bundle and extracts each product's name and price.
export async function getProducts() {
    const { data: script } = await axios.get(apiUrl, { responseType: "text" });

    // Isolate the base product list from the minified JavaScript.
    const productList = script.match(/(\[\{id:0,name:`[\s\S]*?\}\]),za=/);

    if (!productList) {
        throw new Error("Product list was not found in the SauceDemo JavaScript bundle.");
    }

    // Parse product objects and convert each price string to a number.
    const products = [...productList[1].matchAll(
        /\{id:\d+,name:`([^`]+)`,desc:`[\s\S]*?`,price:(\d+(?:\.\d+)?),image_url:`[^`]*`\}/g
    )].map(([, name, price]) => ({
        name,
        price: Number(price),
    }));

    // Report an explicit error if the expected product entries were not parsed.
    if (products.length === 0) {
        throw new Error("No products could be parsed from the SauceDemo JavaScript bundle.");
    }

    return products;
}

// Returns only the product names from the full product list.
export async function getProductNames() {
    const products = await getProducts();
    return products.map(({ name }) => name);
}

// Returns a random, non-repeating selection of products, including prices.
export async function getRandomProducts(count = 3) {
    const products = await getProducts();

    // Ensure the requested number of products can be selected.
    if (!Number.isInteger(count) || count < 0 || count > products.length) {
        throw new RangeError(`count must be an integer between 0 and ${products.length}.`);
    }

    // Shuffle a copy so the original product list remains unchanged.
    const shuffledProducts = [...products];
    for (let index = shuffledProducts.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledProducts[index], shuffledProducts[randomIndex]] =
            [shuffledProducts[randomIndex], shuffledProducts[index]];
    }

    return shuffledProducts.slice(0, count);
}

// Returns random product names only, for callers that do not need prices.
export async function getRandomProductNames(count = 3) {
    const products = await getRandomProducts(count);
    return products.map(({ name }) => name);
}