import { connectDB, Signal } from './_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'GET') {
        try {
            const signals = await Signal.find().sort({ time: -1 }).limit(20);
            return res.status(200).json(signals);
        } catch (err) {
            return res.status(500).json({ error: "Failed to fetch signals" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
