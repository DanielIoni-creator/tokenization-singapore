const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.put('/:id/confirm-payment', orderController.confirmPayment);
router.put('/:id/complete', orderController.completeOrder);

module.exports = router;
