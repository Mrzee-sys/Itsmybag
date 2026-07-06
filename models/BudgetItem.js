const mongoose = require('mongoose');

const budgetItemSchema = new mongoose.Schema({
  // Locks this budget item to the logged-in user
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personName: { type: String, required: true }, 
  itemName: { type: String, required: true },   
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  isPaid: { type: Boolean, default: false },     
  dateAdded: { type: Date, default: Date.now },
  // ADDED: New category field for smart organization
  category: { type: String, default: 'General' }
});

module.exports = mongoose.model('BudgetItem', budgetItemSchema);