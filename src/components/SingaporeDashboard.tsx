import React, { useState } from 'react';

export const SingaporeDashboard: React.FC = () => {
  const [moneroBalance] = useState<number>(1.25);
  const [propertyShare] = useState<number>(15.5);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
      <h2 className="text-2xl font-bold mb-4 text-emerald-400">🇸🇬 Singapore Real Estate Portfolio</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800 rounded-lg">
          <p className="text-gray-400 text-sm">Monero (XMR) Balance</p>
          <p className="text-xl font-bold text-white">{moneroBalance} XMR</p>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg">
          <p className="text-gray-400 text-sm">Tokenized Property Share</p>
          <p className="text-xl font-bold text-white">{propertyShare}%</p>
        </div>
      </div>
    </div>
  );
};
