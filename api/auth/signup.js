import { connectDB, User } from '../_lib/db.js';

export default async function handler(req, res) {
    await connectDB();
    if (req.method === 'POST') {
        const { name, email, password } = req.body;
        try {
            const exists = await User.findOne({ email });
            if (exists) return res.status(400).json({ error: "User already exists" });
            const newUser = new User({ name, email, password, id: Date.now() });
            await newUser.save();
            return res.status(201).json({ message: "User created", user: { id: newUser.id, name: newUser.name, email: newUser.email } });
        } catch (err) {
            return res.status(500).json({ error: "Signup failed" });
        }
    }
    return res.status(405).json({ error: "Method not allowed" });
}
