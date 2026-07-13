const express = require('express');
const router = express.Router();
const Basket = require('../models/Basket');
const Product = require('../models/Product');
const BudgetItem = require('../models/BudgetItem');
const Receipt = require('../models/Receipt'); // NEW: Import Receipt to save History
const auth = require('../middleware/auth.js');

// 1. GET: Fetch the private basket for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    let basket = await Basket.findOne({ userId: req.user.id }).populate('items.productId');
    
    if (!basket) {
      basket = new Basket({ userId: req.user.id, items: [], totalPrice: 0 });
      await basket.save();
    }
    res.json(basket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST: Add or update an item in the user's private basket
router.post('/add', auth, async (req, res) => {
  const { productId, quantity } = req.body;
  
  try {
    let basket = await Basket.findOne({ userId: req.user.id });
    if (!basket) {
      basket = new Basket({ userId: req.user.id, items: [], totalPrice: 0 });
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
    let total = 0;
    basket.items.forEach(item => {
       if (item.productId && item.productId.price) {
         total += (item.productId.price * item.quantity);
       }
    });
    basket.totalPrice = total;

    await basket.save();
    res.json(basket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. POST: Checkout (The Bridge to the Budget AND History)
router.post('/checkout', auth, async (req, res) => {
  const { store, personName } = req.body; 

  try {
    // We must populate the products to get their names and prices for the history snapshot
    const basket = await Basket.findOne({ userId: req.user.id }).populate('items.productId');
    
    if (!basket || basket.items.length === 0) {
      return res.status(400).json({ message: 'Basket is empty' });
    }

    // Step A: Bridge to the Budget
    const budgetExpense = new BudgetItem({
      userId: req.user.id, 
      personName: personName || 'Shaun',
      itemName: `Shopping at ${store || 'Store'}`,
      amount: basket.totalPrice,
      type: 'expense',
      category: 'Food and Drink',
      isPaid: true
    });
    await budgetExpense.save();

    // Step B: Archive to History!
    const newReceipt = new Receipt({
      userId: req.user.id,
      personName: personName || 'Shaun', // Tags the trip with the user's name
      store: store || 'Unknown Store',
      totalPrice: basket.totalPrice,
      items: basket.items.map(item => ({
        name: item.productId?.name || 'Unknown Item',
        price: item.productId?.price || 0,
        quantity: item.quantity
      }))
    });
    await newReceipt.save();

    // Step C: Clear the bag
    basket.items = [];
    basket.totalPrice = 0;
    await basket.save();

    res.json({ message: 'Checkout successful, budget updated, and trip archived!', basket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;