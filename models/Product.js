const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true // Allows items to exist without barcodes (like loose bakery/produce items)
  },
  quantityType: {
    type: String,
    default: '1x' // e.g., '1x', '200g', '1L'
  },
  price: {
    type: Number,
    default: 0.00
  },
  icon: {
    type: String,
    default: 'fa-shopping-basket' // Default icon if none is assigned
  },
  category: {
    type: String,
    enum: ['Groceries', 'Meat','Fruit & Veg', 'Cleaning Products', 'Snacks'],
    default: 'Groceries'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);