const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const auth = require('../middleware/auth.js');

// Admin emails allowed to see all household history
const ADMIN_EMAILS = ['shaunzurcher@gmail.com', 'carriezurcher@gmail.com'];

// Get past shopping trips
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If NOT an admin, filter by the user's ID OR show legacy records (no userId)
    if (!ADMIN_EMAILS.includes(req.user.email)) {
      query = { 
        $or: [
          { userId: req.user.id },
          { userId: { $exists: false } } // Include legacy data so user's history isn't empty
        ] 
      };
    }
    
    const receipts = await Receipt.find(query).sort({ date: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a receipt's store name
router.put('/:id', auth, async (req, res) => {
  try {
    // Admins can edit any receipt; others only their own
    const query = ADMIN_EMAILS.includes(req.user.email) 
      ? { _id: req.params.id } 
      : { _id: req.params.id, userId: req.user.id };

    const updatedReceipt = await Receipt.findOneAndUpdate(
      query,
      { store: req.body.store },
      { new: true } 
    );
    
    if (!updatedReceipt) return res.status(404).json({ message: 'Receipt not found or unauthorized' });
    res.json(updatedReceipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete an entire receipt
router.delete('/:id', auth, async (req, res) => {
  try {
    const query = ADMIN_EMAILS.includes(req.user.email) 
      ? { _id: req.params.id } 
      : { _id: req.params.id, userId: req.user.id };

    const deleted = await Receipt.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'Receipt not found or unauthorized' });
    
    res.json({ message: 'Receipt deleted completely' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Move an item to a different store (Splits the receipt)
router.post('/:id/move-item', auth, async (req, res) => {
  try {
    const { itemIndex, newStore } = req.body;
    
    const query = ADMIN_EMAILS.includes(req.user.email) 
      ? { _id: req.params.id } 
      : { _id: req.params.id, userId: req.user.id };

    const oldReceipt = await Receipt.findOne(query);
    
    if (!oldReceipt) return res.status(404).json({ message: "Receipt not found or unauthorized" });
    
    const itemToMove = oldReceipt.items[itemIndex];
    if (!itemToMove) return res.status(404).json({ message: "Item not found" });

    const itemTotal = itemToMove.price * itemToMove.quantity;

    oldReceipt.items.splice(itemIndex, 1);
    oldReceipt.totalPrice -= itemTotal;

    const startOfDay = new Date(oldReceipt.date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(oldReceipt.date);
    endOfDay.setHours(23,59,59,999);

    let targetReceipt = await Receipt.findOne({
      store: newStore,
      date: { $gte: startOfDay, $lte: endOfDay },
      userId: oldReceipt.userId
    });

    if (targetReceipt) {
      targetReceipt.items.push(itemToMove);
      targetReceipt.totalPrice += itemTotal;
      await targetReceipt.save();
    } else {
      targetReceipt = new Receipt({
        userId: oldReceipt.userId,
        personName: oldReceipt.personName,
        store: newStore,
        date: oldReceipt.date, 
        totalPrice: itemTotal,
        items: [itemToMove]
      });
      await targetReceipt.save();
    }

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