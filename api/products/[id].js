import { connectDB, Product } from '../_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            const parsedId = parseInt(id);
            if (!isNaN(parsedId)) {
                await Product.deleteOne({ id: parsedId });
            } else {
                await Product.deleteOne({ _id: id });
            }
            return res.status(200).json({ message: "Product deleted" });
        } catch (err) {
            return res.status(500).json({ error: "Failed to delete product" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
