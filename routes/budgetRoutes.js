const express = require('express');
const router = express.Router();
const BudgetItem = require('../models/BudgetItem');

// Get all budget items
router.get('/', async (req, res) => {
  try {
    const items = await BudgetItem.find().sort({ dateAdded: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new budget item (UPDATED to accept 'type')
router.post('/', async (req, res) => {
  const { personName, itemName, amount, type } = req.body;
  try {
    const newItem = new BudgetItem({ 
      personName, 
      itemName, 
      amount,
      type: type || 'expense' // Fallback to expense if not provided
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an item (UPDATED to accept 'type')
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await BudgetItem.findByIdAndUpdate(
      req.params.id,
      { 
        itemName: req.body.itemName, 
        amount: req.body.amount,
        type: req.body.type 
      },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an item
router.delete('/:id', async (req, res) => {
  try {
    await BudgetItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Budget item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;