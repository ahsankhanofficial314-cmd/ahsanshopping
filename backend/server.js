import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_UR;

if (!MONGODB_URI) {
    console.log('⚠️ WARNING: MONGODB_URI is not defined! Local .env might be missing.');
}

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ SUCCESS: Connected to MongoDB Atlas');
        await seedDatabase();
    })
    .catch(err => {
        console.error('❌ ERROR: MongoDB Connection Failed!', err.message);
    });

// Models
const userSchema = new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "images/product_men.png" },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const signalSchema = new mongoose.Schema({
    message: { type: String, required: true },
    time: { type: Date, default: Date.now }
});
const Signal = mongoose.model('Signal', signalSchema);

// Initial Data (Embedded for Vercel Reliability)
const initialProducts = [
    { id: 1, name: "Classic Oxford Shirt", price: 55, category: "men", image: "images/product_men.png", description: "A premium quality classic oxford shirt for men." },
    { id: 2, name: "Premium Leather Jacket", price: 120, category: "men", image: "images/product_men.png", description: "High-quality faux leather jacket." },
    { id: 3, name: "Men's Casual Sneakers", price: 85, category: "men", image: "images/product_men.png", description: "Comfortable and durable sneakers." },
    { id: 4, name: "Summer Floral Dress", price: 65, category: "women", image: "images/product_women.png", description: "Elegant summer dress." },
    { id: 5, name: "Luxury Evening Gown", price: 150, category: "women", image: "images/product_women.png", description: "Stunning evening gown." },
    { id: 6, name: "Designer Handbag", price: 95, category: "women", image: "images/product_women.png", description: "Stylish premium handbag." },
    { id: 7, name: "Kids Denim Jacket", price: 35, category: "kids", image: "images/product_kids.png", description: "Rough-tough denim for kids." },
    { id: 8, name: "Kids Summer T-Shirt", price: 20, category: "kids", image: "images/product_kids.png", description: "Breathable cotton t-shirt." },
    { id: 9, name: "Kids School Shoes", price: 40, category: "kids", image: "images/product_kids.png", description: "Durable school shoes." }
];

async function seedDatabase() {
    try {
        const pCount = await Product.countDocuments();
        if (pCount === 0) {
            await Product.insertMany(initialProducts);
            console.log('📦 Database Seeded: Products added');
        }
    } catch (err) { console.error('❌ Seeding Error:', err.message); }
}

// Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ error: "Failed to fetch products" }); }
});

app.post('/api/products', async (req, res) => {
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
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: "Failed to add product" });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id);
        if (!isNaN(parsedId)) {
            await Product.deleteOne({ id: parsedId });
        } else {
            await Product.deleteOne({ _id: id });
        }
        res.json({ message: "Product deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: "User already exists" });
        const newUser = new User({ name, email, password, id: Date.now() });
        await newUser.save();
        res.status(201).json({ message: "User created", user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (err) { res.status(500).json({ error: "Signup failed" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });
        res.json({ message: "Login success", user: { id: user.id || user._id, name: user.name, email: user.email } });
    } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

app.get('/api/signals', async (req, res) => {
    try {
        const signals = await Signal.find().sort({ time: -1 }).limit(20);
        res.json(signals);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// Health check (Optional: only if needed for internal monitoring)
// app.get('/api/health', (req, res) => res.json({ status: 'AhsanShopping API is running!' }));

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
