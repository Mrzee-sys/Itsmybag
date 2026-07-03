const jwt = require('jsonwebtoken');

// Matching the secret from your auth route
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_household_key';

module.exports = function(req, res, next) {
  // 1. Check if the frontend sent an ID card (token)
  const token = req.header('Authorization');

  // 2. If no card, deny entry
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // 3. Clean up the token string if it includes "Bearer "
    const actualToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    
    // 4. Verify the card is legit
    const decoded = jwt.verify(actualToken, JWT_SECRET);
    
    // 5. Attach the user's ID to the request so the Basket route knows who is asking!
    // Since your login route uses { id: user._id }, this will be decoded.id
    req.user = decoded; 
    
    // 6. Let them into the route
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};