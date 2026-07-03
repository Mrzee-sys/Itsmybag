const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const auth = require('../middleware/auth.js'); // Updated with .js extension for explicit loading


// Get all past shopping trips, sorted by newest first
router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ date: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a receipt's store name
router.put('/:id', async (req, res) => {
  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      { store: req.body.store },
      { new: true } 
    );
    res.json(updatedReceipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NEW: Delete an entire receipt
router.delete('/:id', async (req, res) => {
  try {
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Receipt deleted completely' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NEW: Move an item to a different store (Splits the receipt)
router.post('/:id/move-item', async (req, res) => {
  try {
    const { itemIndex, newStore } = req.body;
    const oldReceipt = await Receipt.findById(req.params.id);
    
    if (!oldReceipt) return res.status(404).json({ message: "Receipt not found" });
    
    // Extract the item
    const itemToMove = oldReceipt.items[itemIndex];
    if (!itemToMove) return res.status(404).json({ message: "Item not found" });

    // Calculate the item's total cost to adjust receipt totals
    const itemTotal = itemToMove.price * itemToMove.quantity;

    // Remove item from old receipt and reduce total
    oldReceipt.items.splice(itemIndex, 1);
    oldReceipt.totalPrice -= itemTotal;

    // Check if a receipt already exists for this new store on the same day
    const startOfDay = new Date(oldReceipt.date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(oldReceipt.date);
    endOfDay.setHours(23,59,59,999);

    let targetReceipt = await Receipt.findOne({
      store: newStore,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (targetReceipt) {
      // Merge into the existing receipt for that store
      targetReceipt.items.push(itemToMove);
      targetReceipt.totalPrice += itemTotal;
      await targetReceipt.save();
    } else {
      // Spin it off into a brand new receipt for that day
      targetReceipt = new Receipt({
        store: newStore,
        date: oldReceipt.date, 
        totalPrice: itemTotal,
        items: [itemToMove]
      });
      await targetReceipt.save();
    }

    // If the old receipt is empty now, delete it to keep things clean
    if (oldReceipt.items.length === 0) {
      await Receipt.findByIdAndDelete(oldReceipt._id);
    } else {
      await oldReceipt.save();
    }

    res.json({ message: 'Item moved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;