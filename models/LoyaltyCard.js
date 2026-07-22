const mongoose = require('mongoose');

const LoyaltyCardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cardName: { 
    type: String, 
    required: true 
  },
  owner: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true // Stores the compressed base64 string directly in MongoDB
  }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyCard', LoyaltyCardSchema);