// routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get conversations list
router.get('/conversations', messageController.getConversationsList);

// Get conversation with user
router.get('/conversation/:userId', messageController.getConversation);

// Send message
router.post('/send', messageController.sendMessage);

// Mark messages as read
router.put('/read', messageController.markAsRead);

// Get unread count
router.get('/unread', messageController.getUnreadCount);

module.exports = router;
