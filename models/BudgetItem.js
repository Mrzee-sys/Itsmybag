const mongoose = require('mongoose');

const budgetItemSchema = new mongoose.Schema({
  // NEW: Locks this budget item to the logged-in user
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personName: { type: String, required: true }, 
  itemName: { type: String, required: true },   
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  isPaid: { type: Boolean, default: false },     
  dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BudgetItem', budgetItemSchema);