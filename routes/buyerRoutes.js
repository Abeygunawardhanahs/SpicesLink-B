const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

// AUTH 
router.post('/register', buyerController.registerBuyer);
router.post('/login', buyerController.loginBuyer);

// BANK DETAILS 
router.post('/:userId/bank-details', buyerController.addBankDetails);

// GET ALL BUYERS (for shops list)
router.get('/all', buyerController.getAllBuyers);

// GET BUYER PROFILE BY ID (new endpoint)
router.get('/profile/:id', buyerController.getBuyerProfileById);

// GET BUYER BY ID 
router.get('/:_id', buyerController.getBuyerById);

module.exports = router;
