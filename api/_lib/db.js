import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_UR;

let isConnected = false;

export async function connectDB() {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
    } catch (err) {
        throw err;
    }
}

// Models
const userSchema = new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
export const User = mongoose.models.User || mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    id: Number,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "images/product_men.png" },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});
export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
