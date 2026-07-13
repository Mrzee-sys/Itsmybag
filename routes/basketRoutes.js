const express = require('express');
const router = express.Router();
const Basket = require('../models/Basket');
const Product = require('../models/Product');
const BudgetItem = require('../models/BudgetItem'); // We import this to build the bridge!
const auth = require('../middleware/auth.js');

// 1. GET: Fetch the private basket for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    let basket = await Basket.findOne({ userId: req.user.id }).populate('items.productId');
    
    // If they don't have a basket yet, create one for them
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

    // Check if item is already in the basket
    const itemIndex = basket.items.findIndex(item => item.productId.toString() === productId);
    
    if (itemIndex > -1) {
      // Item exists, just update the quantity
      basket.items[itemIndex].quantity += (quantity || 1);
    } else {
      // New item, add to array
      basket.items.push({ productId, quantity: quantity || 1 });
    }

    // Recalculate the total price
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

// 3. POST: Checkout (The Bridge to the Budget)
router.post('/checkout', auth, async (req, res) => {
  // Frontend will send the store name and WHO is paying for it
  const { store, personName } = req.body; 

  try {
    const basket = await Basket.findOne({ userId: req.user.id });
    
    if (!basket || basket.items.length === 0) {
      return res.status(400).json({ message: 'Basket is empty' });
    }

    // Step A: Create the bridge! Log this trip as an expense in the Budget
    const budgetExpense = new BudgetItem({
      userId: req.user.id, 
      personName: personName || 'Shaun', // Defaults to you if no name is passed
      itemName: `Shopping at ${store || 'Store'}`,
      amount: basket.totalPrice,
      type: 'expense',
      category: 'Food and Drink', // Automatically categorized as groceries/food
      isPaid: true // Automatically marked as paid since it's a checkout
    });
    
    await budgetExpense.save();

    // Step B: Archive to History (If you build a specific History model later, you'd insert it here)

    // Step C: Clear the user's private basket so they can start fresh
    basket.items = [];
    basket.totalPrice = 0;
    await basket.save();

    res.json({ message: 'Checkout successful, budget updated!', basket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;