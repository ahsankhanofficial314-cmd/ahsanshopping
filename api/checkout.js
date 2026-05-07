import { connectDB, Signal } from './_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'POST') {
        try {
            const { cart, method } = req.body;
            
            // Create a signal for the new order
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            const newSignal = new Signal({
                message: `New Order: $${total.toFixed(2)} via ${method}`,
                time: new Date()
            });
            await newSignal.save();

            return res.status(200).json({ 
                success: true, 
                orderId: "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase() 
            });
        } catch (err) {
            return res.status(500).json({ error: "Checkout failed" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
