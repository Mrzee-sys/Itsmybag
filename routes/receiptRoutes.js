const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');

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
      { new: true } // Returns the updated document
    );
    res.json(updatedReceipt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;