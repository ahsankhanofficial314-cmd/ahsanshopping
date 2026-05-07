import { connectDB, User } from '../_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'POST') {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email, password });
            if (!user) return res.status(401).json({ error: "Invalid credentials" });
            return res.status(200).json({ message: "Login success", user: { id: user.id || user._id, name: user.name, email: user.email } });
        } catch (err) {
            return res.status(500).json({ error: "Login failed" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
