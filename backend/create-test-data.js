const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Token = require('./models/Token');
  const Order = require('./models/Order');
  const User = require('./models/User');

  const token = await Token.findOne({ symbol: 'MBFT' });
  const user = await User.findOne({ role: 'superadmin' });

  if (!token) {
    console.error('❌ Token MBFT non trovato!');
    process.exit();
  }
  if (!user) {
    console.error('❌ Nessun admin trovato!');
    process.exit();
  }

  console.log('📊 Token trovato:', token.symbol);
  console.log('👤 Admin trovato:', user.email);

  const ordersData = [
    {
      amount: 5,
      totalPrice: 5000,
      status: 'completed',
      paymentStatus: 'completed',
      moneroTxHash: '0x' + 'a'.repeat(64),
      moneroConfirmations: 10,
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    },
    {
      amount: 3,
      totalPrice: 3000,
      status: 'processing',
      paymentStatus: 'completed',
      moneroTxHash: '0x' + 'b'.repeat(64),
      moneroConfirmations: 8,
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      amount: 2,
      totalPrice: 2000,
      status: 'pending',
      paymentStatus: 'pending',
      moneroSubaddress: '8Bx8v' + 'c'.repeat(10)
    }
  ];

  for (const orderData of ordersData) {
    const order = new Order({
      userId: user._id,
      tokenId: token._id,
      amount: orderData.amount,
      totalPrice: orderData.totalPrice,
      paymentMethod: 'monero',
      paymentStatus: orderData.paymentStatus,
      moneroSubaddress: orderData.moneroSubaddress || '8Bx8vM7nQpL4kR2wXy9zJ3cT6fA1dG5hE8jN4sU7tV2yW9zK3mP6qR8sT5uV2x',
      moneroTxHash: orderData.moneroTxHash,
      moneroConfirmations: orderData.moneroConfirmations || 0,
      status: orderData.status,
      spvConfirmation: {
        received: orderData.status === 'completed',
        date: orderData.completedAt || null
      },
      createdAt: orderData.paidAt || new Date(),
      updatedAt: new Date(),
      paidAt: orderData.paidAt,
      completedAt: orderData.completedAt
    });

    await order.save();
    console.log('✅ Ordine creato:', order.status);
  }

  const completedOrders = await Order.find({ tokenId: token._id, status: 'completed' });
  const totalInvestors = new Set(completedOrders.map(o => o.userId.toString())).size;
  const totalRaised = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  await Token.updateOne(
    { _id: token._id },
    {
      'stats.totalInvestors': totalInvestors,
      'stats.totalRaised': totalRaised,
      'stats.totalDistributed': totalRaised
    }
  );

  console.log('✅ Statistiche token aggiornate!');
  console.log('📊 Investitori:', totalInvestors);
  console.log('💰 Totale raccolto:', totalRaised);

  process.exit();
}).catch(err => {
  console.error('❌ Errore:', err);
  process.exit();
});
