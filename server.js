const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 Connected successfully to MongoDB Atlas!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Link API Endpoint Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/basket', require('./routes/basketRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes')); // <-- NEW: Added Receipt/History Routes
app.use('/api/budget', require('./routes/budgetRoutes')); // <-- NEW: Added Budget Routes
app.get('/', (req, res) => {
  res.send('Shopping List API Backend is Running...');
});

app.listen(PORT, () => {
  console.log(`Server is blasting off on port ${PORT}`);
});