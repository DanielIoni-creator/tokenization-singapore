require('dotenv').config();
const { bot, notificationService } = require('./index');

async function testNotifications() {
  console.log('📨 Test notifiche...');
  
  await notificationService.notifyNewOrder({
    _id: 'test-123',
    userId: 'test-user',
    tokenId: { name: 'Marina Bay Tower' },
    totalPrice: 5000,
    status: 'pending'
  });
  
  console.log('✅ Test completato!');
}

testNotifications().catch(console.error);
