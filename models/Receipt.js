const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  store: { type: String, default: 'Unknown Store' }, // <-- NEW FIELD ADDED HERE
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