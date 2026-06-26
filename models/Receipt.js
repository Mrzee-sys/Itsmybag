const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalPrice: { type: Number, required: true },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ]
});

module.exports = mongoose.model('Receipt', receiptSchema);