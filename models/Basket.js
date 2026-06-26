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
  // Tied to a simple household ID or shared space later for you and your wife
  items: [BasketItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0.00
  }
}, { timestamps: true });

module.exports = mongoose.model('Basket', BasketSchema);