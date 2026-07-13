const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  // Added userId and personName to link records to specific users
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  personName: { 
    type: String, 
    default: 'User' 
  },
  store: { 
    type: String, 
    default: 'Unknown Store' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ]
});

module.exports = mongoose.model('Receipt', receiptSchema);