const express = require('express');
const router = express.Router();
const Basket = require('../models/Basket');
const Product = require('../models/Product');
const Receipt = require('../models/Receipt'); 
const auth = require('../middleware/auth'); // <-- The Bouncer we just created

// 1. Fetch the active basket list FOR THIS SPECIFIC USER
router.get('/', auth, async (req, res) => {
  try {
    // UPDATED: Using req.user.id to match your login token
    let basket = await Basket.findOne({ userId: req.user.id }).populate('items.productId');
    if (!basket) {
      basket = await Basket.create({ userId: req.user.id, items: [], totalPrice: 0 });
    }
    res.json(basket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Add an item or bump up its count in THIS USER'S basket
router.post('/add', auth, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // UPDATED: req.user.id
    let basket = await Basket.findOne({ userId: req.user.id });
    if (!basket) {
      basket = await Basket.create({ userId: req.user.id, items: [], totalPrice: 0 });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const itemIndex = basket.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      basket.items[itemIndex].quantity += (quantity || 1);
    } else {
      basket.items.push({ productId, quantity: quantity || 1 });
    }

    await basket.populate('items.productId');
    basket.totalPrice = basket.items.reduce((total, item) => {
      return total + (item.productId.price * item.quantity);
    }, 0);

    await basket.save();
    res.json(basket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. CHECKOUT: Archive to Receipt and empty THIS USER'S basket
router.post('/checkout', auth, async (req, res) => {
  try {
    const { store } = req.body;

    // UPDATED: req.user.id
    const basket = await Basket.findOne({ userId: req.user.id }).populate('items.productId');
    
    if (!basket || basket.items.length === 0) {
      return res.status(400).json({ message: "Basket is already empty" });
    }

    const receiptItems = basket.items.map(item => ({
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity
    }));

    // Save the new permanent receipt, attaching it to THIS USER (req.user.id)
    const newReceipt = new Receipt({
      userId: req.user.id, 
      store: store || 'Unknown Store', 
      items: receiptItems,
      totalPrice: basket.totalPrice
    });
    await newReceipt.save();

    basket.items = [];
    basket.totalPrice = 0;
    await basket.save();

    res.json({ message: "Checkout successful", receipt: newReceipt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;