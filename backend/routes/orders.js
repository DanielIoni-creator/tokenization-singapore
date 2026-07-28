const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// Read routes
router.get('/', authenticate, orderController.getUserOrders);
router.get('/:id', authenticate, orderController.getOrderById);

// Lifecycle routes (added for #2: email notifications on order events)
router.post('/', authenticate, orderController.createOrder);
router.post('/:id/confirm-payment', authenticate, orderController.confirmPayment);
router.post('/:id/complete', authenticate, orderController.completeOrder);

module.exports = router;
