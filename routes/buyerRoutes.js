const express = require('express');
const router = express.Router();

// UPDATED: Only import the functions that actually exist in your controller.
const {
  registerBuyer,
  loginBuyer
} = require('../controllers/BuyerController');

// You may need this middleware later, so we will keep the import.
const { authenticateBuyer } = require('../middleware/auth');

// --- Public routes ---
// These routes will continue to work correctly.
router.post('/register', registerBuyer);
router.post('/login', loginBuyer);


// --- Protected routes (require authentication) ---
// UPDATED: These routes have been temporarily commented out to prevent the server crash.
// You can uncomment them once you add the 'getBuyerProfile' and 'updateBuyerProfile'
// functions back into your BuyerController.js file.

// router.get('/profile', authenticateBuyer, getBuyerProfile);
// router.put('/profile', authenticateBuyer, updateBuyerProfile);


module.exports = router;