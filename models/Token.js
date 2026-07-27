const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  contractAddress: { type: String, default: "" },
  totalSupply: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Token', TokenSchema);
