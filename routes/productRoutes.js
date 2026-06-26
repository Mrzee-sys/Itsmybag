const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 1. Get all products for the master list view
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Handle a barcode scan (Check local DB first, fallback to Open Food Facts SA)
router.post('/scan', async (req, res) => {
  const { barcode } = req.body;

  if (!barcode) {
    return res.status(400).json({ message: 'Barcode is required' });
  }

  try {
    // Step A: Check if this barcode already exists in your local MongoDB
    let product = await Product.findOne({ barcode });
    
    if (product) {
      return res.json({ message: 'Found in local database', product, isNew: false });
    }

    // Step B: Fallback—Fetch from Open Food Facts South Africa localization
    const url = `https://za.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const productName = data.product.product_name || 'Unknown Item';
      
      let assignedCategory = 'Groceries';
      const tags = JSON.stringify(data.product.categories_tags || []).toLowerCase();
      if (tags.includes('snack')) assignedCategory = 'Snacks';
      else if (tags.includes('meat') || tags.includes('chicken')) assignedCategory = 'Meat';
      else if (tags.includes('clean') || tags.includes('wash')) assignedCategory = 'Cleaning Products';
      else if (tags.includes('veg') || tags.includes('fruit')) assignedCategory = 'Fruit & Veg';

      const newProductData = {
        name: productName,
        barcode: barcode,
        price: 0.00,
        category: assignedCategory,
        icon: 'fa-shopping-basket' 
      };

      return res.json({ 
        message: 'Found on Open Food Facts SA', 
        product: newProductData, 
        isNew: true 
      });
    }

    // Step C: Truly not found anywhere, let user manually name it
    res.json({ message: 'Product not found globally', product: { barcode, name: '', price: 0.00 }, isNew: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Save a new manually typed or freshly scanned item to the master list
router.post('/', async (req, res) => {
  const { name, barcode, price, category, icon } = req.body;
  const product = new Product({ name, barcode, price, category, icon });
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Update an existing product's price/name (Crucial for live price updates)
router.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { price: req.body.price, name: req.body.name }, 
      { new: true } 
    );
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// 5. Delete a product from the master list
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;