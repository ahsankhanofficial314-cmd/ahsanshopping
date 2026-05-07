import { connectDB, Product } from './_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'GET') {
        try {
            const products = await Product.find().sort({ createdAt: -1 });
            return res.status(200).json(products);
        } catch (err) {
            return res.status(500).json({ error: "Failed to fetch products" });
        }
    } else if (req.method === 'POST') {
        try {
            const { name, price, category, description, image } = req.body;
            const newProduct = new Product({
                id: Date.now(),
                name,
                price: parseFloat(price),
                category,
                description,
                image
            });
            await newProduct.save();
            return res.status(201).json(newProduct);
        } catch (err) {
            return res.status(500).json({ error: "Failed to add product" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
