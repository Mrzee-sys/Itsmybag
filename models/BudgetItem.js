const mongoose = require('mongoose');

const budgetItemSchema = new mongoose.Schema({
  personName: { type: String, required: true }, 
  itemName: { type: String, required: true },   
  amount: { type: Number, required: true },
  // NEW: Track if this is income or expense (defaults to expense for older items)
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },     
  dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BudgetItem', budgetItemSchema);