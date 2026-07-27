const router = require('express').Router();
const ctrl = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/conversations', auth, ctrl.getConversations);
router.get('/conversation/:userId', auth, ctrl.getConversation);
router.post('/send', auth, ctrl.sendMessage);
router.put('/read', auth, ctrl.markRead);
router.delete('/:messageId', auth, ctrl.deleteMessage);

module.exports = router;
