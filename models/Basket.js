const mongoose = require('mongoose');

const BasketItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  isPicked: {
    type: Boolean,
    default: false // Toggles when you tap it inside the store
  }
});

const BasketSchema = new mongoose.Schema({
  // NEW: Locks this basket to the specific logged-in user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [BasketItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0.00
  }
}, { timestamps: true });

module.exports = mongoose.model('Basket', BasketSchema);