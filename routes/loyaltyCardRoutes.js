const express = require('express');
const router = express.Router();
const LoyaltyCard = require('../models/LoyaltyCard');
const auth = require('../middleware/auth.js');
const multer = require('multer');

// Configure multer to store files temporarily in memory buffer
const upload = multer({ storage: multer.memoryStorage() });

// 1. GET: Fetch all loyalty cards for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const cards = await LoyaltyCard.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST: Upload and save a new loyalty card
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { cardName, owner } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Card image is required' });
    }

    // Convert the compressed buffer into a clean Base64 string for MongoDB storage
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const newCard = new LoyaltyCard({
      userId: req.user.id,
      cardName,
      owner,
      imageUrl: base64Image
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (err) {
    console.error("Loyalty card save error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE: Remove a loyalty card
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedCard = await LoyaltyCard.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!deletedCard) {
      return res.status(404).json({ message: 'Loyalty card not found or unauthorized' });
    }

    res.json({ message: 'Loyalty card deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;