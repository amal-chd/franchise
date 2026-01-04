
const fetch = require('node-fetch');

async function testAddProduct() {
    try {
        const response = await fetch('http://localhost:3002/api/shop/products?admin=true', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: "Debug Product " + Date.now(),
                description: "This is a test product",
                price: 100,
                image_url: "https://via.placeholder.com/150",
                category_id: 1,
                stock: 10
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testAddProduct();
