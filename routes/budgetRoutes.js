const express = require('express');
const router = express.Router();
const BudgetItem = require('../models/BudgetItem');
const auth = require('../middleware/auth'); // <-- The Bouncer!

// Get all budget items for the LOGGED IN USER
router.get('/', auth, async (req, res) => {
  try {
    const items = await BudgetItem.find({ userId: req.user.id }).sort({ dateAdded: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new budget item
router.post('/', auth, async (req, res) => {
  const { personName, itemName, amount, type } = req.body;
  try {
    const newItem = new BudgetItem({ 
      userId: req.user.id, // <-- Fences data to the user
      personName, 
      itemName, 
      amount,
      type: type || 'expense' 
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an item
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedItem = await BudgetItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        itemName: req.body.itemName, 
        amount: req.body.amount,
        type: req.body.type,
        isPaid: req.body.isPaid 
      },
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Monthly Reset 
router.post('/reset/:personName', auth, async (req, res) => {
  try {
    await BudgetItem.updateMany(
      { userId: req.user.id, personName: req.params.personName, type: 'expense' },
      { isPaid: false }
    );
    res.json({ message: 'Monthly reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a single item
router.delete('/:id', auth, async (req, res) => {
  try {
    await BudgetItem.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Budget item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NEW: Delete an ENTIRE family member and all their items
router.delete('/person/:personName', auth, async (req, res) => {
  try {
    await BudgetItem.deleteMany({ userId: req.user.id, personName: req.params.personName });
    res.json({ message: 'Family member deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;