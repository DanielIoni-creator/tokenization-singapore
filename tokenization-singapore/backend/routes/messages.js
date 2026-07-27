const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/conversations', messageController.getConversations);
router.get('/conversation/:targetUserId', messageController.getConversationWithUser);
router.post('/send', messageController.sendMessage);
router.put('/read', messageController.markAsRead);
router.get('/unread', messageController.getUnreadCount);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
