import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for demo/simplicity
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in .env file!');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB Atlas');
    })
    .catch(err => {
        console.error('❌ ERROR: MongoDB Connection Failed!');
        console.error('Reason:', err.message);
        console.log('Please check your MONGODB_URI and Network Access (0.0.0.0/0) in MongoDB Atlas.');
    });

// =======================
// MONGOOSE MODELS
// =======================

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
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

// =======================
// API ROUTES
// =======================

// --- Products API ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, price, category, image, description } = req.body;
    if (!name || !price || !category) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const newProduct = new Product({
            name,
            price: parseFloat(price),
            category,
            image: image || "images/product_men.png",
            description: description || ""
        });
        await newProduct.save();
        res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        res.status(500).json({ error: "Failed to add product" });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// --- Signals API ---
app.get('/api/signals', async (req, res) => {
    try {
        const signals = await Signal.find().sort({ time: -1 }).limit(20);
        res.json(signals);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch signals" });
    }
});

// Helper to push a signal
async function pushSignal(message) {
    try {
        const newSignal = new Signal({ message });
        await newSignal.save();
        
        // Cleanup: Keep only last 20 signals
        const count = await Signal.countDocuments();
        if (count > 20) {
            const oldest = await Signal.find().sort({ time: 1 }).limit(count - 20);
            const ids = oldest.map(s => s._id);
            await Signal.deleteMany({ _id: { $in: ids } });
        }
    } catch (err) {
        console.error("Signal Error:", err);
    }
}

// --- Users API (Admin) ---
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// --- Auth API ---
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUser = new User({ name, email, password }); // Note: Still not hashing for now, keep as per user request
        await newUser.save();

        await pushSignal(`New user registered: ${name}`);

        res.status(201).json({ message: "User created successfully", user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (err) {
        res.status(500).json({ error: "Signup failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// --- Checkout API ---
app.post('/api/checkout', (req, res) => {
    const { method } = req.body;
    // Simulate payment processing delay
    setTimeout(async () => {
        const orderId = `ORD-${Date.now()}`;
        await pushSignal(`New order ${orderId} placed via ${method}!`);
        res.json({ success: true, message: `Payment processed successfully via ${method}`, orderId });
    }, 1500);
});

// Fallback route for frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
