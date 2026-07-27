const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const messageController = require('../controllers/messageController');

// JWT Middleware Authentication
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
      if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Authorization header missing' });
  }
};

router.use(authenticateJWT);

router.get('/conversations', messageController.getConversations);
router.get('/conversation/:userId', messageController.getConversationWithUser);
router.post('/send', messageController.sendMessage);
router.put('/read', messageController.markAsRead);
router.get('/unread', messageController.getUnreadCount);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
