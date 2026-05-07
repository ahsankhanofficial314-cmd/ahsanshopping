import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: Number,
    category: String
});
const Product = mongoose.model('Product', productSchema);

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        const count = await Product.countDocuments();
        console.log('Product count:', count);
        const products = await Product.find().limit(5);
        console.log('First 5 products:', JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
