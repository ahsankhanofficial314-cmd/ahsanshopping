import { connectDB, User } from './_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'GET') {
        try {
            const users = await User.find({}, '-password').sort({ createdAt: -1 });
            return res.status(200).json(users);
        } catch (err) {
            return res.status(500).json({ error: "Failed to fetch users" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
