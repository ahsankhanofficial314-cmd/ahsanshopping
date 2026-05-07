import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_UR;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(async () => {
            console.log('✅ SUCCESS: Connected to MongoDB Atlas');
            await seedDatabase();
        })
        .catch(err => console.error('❌ ERROR: MongoDB Connection Failed!', err.message));
}

// Models
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}));

const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "images/product_men.png" },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
}));

const Signal = mongoose.models.Signal || mongoose.model('Signal', new mongoose.Schema({
    message: { type: String, required: true },
    time: { type: Date, default: Date.now }
}));

// Seeding Data
const initialProducts = [
    { id: 1, name: "Classic Oxford Shirt", price: 55, category: "men", image: "images/product_men.png" },
    { id: 2, name: "Premium Leather Jacket", price: 120, category: "men", image: "images/product_men.png" },
    { id: 3, name: "Men's Casual Sneakers", price: 85, category: "men", image: "images/product_men.png" },
    { id: 4, name: "Summer Floral Dress", price: 65, category: "women", image: "images/product_women.png" },
    { id: 5, name: "Luxury Evening Gown", price: 150, category: "women", image: "images/product_women.png" },
    { id: 6, name: "Designer Handbag", price: 95, category: "women", image: "images/product_women.png" },
    { id: 7, name: "Kids Denim Jacket", price: 35, category: "kids", image: "images/product_kids.png" },
    { id: 8, name: "Kids Summer T-Shirt", price: 20, category: "kids", image: "images/product_kids.png" },
    { id: 9, name: "Kids School Shoes", price: 40, category: "kids", image: "images/product_kids.png" }
];

async function seedDatabase() {
    try {
        const pCount = await Product.countDocuments();
        if (pCount === 0) {
            await Product.insertMany(initialProducts);
            console.log('📦 Database Seeded');
        }
    } catch (err) { console.error('❌ Seeding Error:', err.message); }
}

// Routes (Handling both /api/path and /path)
app.get(['/api/products', '/products'], async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.post(['/api/auth/signup', '/auth/signup'], async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: "User already exists" });
        const newUser = new User({ name, email, password, id: Date.now() });
        await newUser.save();
        res.status(201).json({ message: "User created", user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (err) { res.status(500).json({ error: "Signup failed" }); }
});

app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });
        res.json({ message: "Login success", user: { id: user.id || user._id, name: user.name, email: user.email } });
    } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

// Fallback for any other /api routes
app.all('/api/(.*)', (req, res) => {
    res.status(404).json({ error: "API route not found", path: req.url });
});

export default app;
