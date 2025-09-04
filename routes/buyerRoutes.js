const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

// --- AUTH ---
router.post('/register', buyerController.registerBuyer);
router.post('/login', buyerController.loginBuyer);

// --- BANK DETAILS ---
router.post('/:userId/bank-details', buyerController.addBankDetails);

// --- GET BUYER BY ID ---
router.get('/:_id', buyerController.getBuyerById);

module.exports = router;
