import React, { useState } from 'react';

/**
 * Singapore User Dashboard Component
 * Resolves Issue #21 (Dashboard per Utenti Singapore)
 */

interface RealEstateAsset {
  id: string;
  name: string;
  location: string;
  tokensOwned: number;
  totalTokens: number;
  tokenPriceSGD: number;
  totalValueSGD: number;
  monthlyYieldSGD: number;
  roiPercentage: number;
  category: 'Commercial' | 'Residential' | 'Industrial';
}

export const SingaporeUserDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Sample Singapore Real Estate Assets Data
  const assets: RealEstateAsset[] = [
    {
      id: 'SG-MBR-01',
      name: 'Marina Bay Residences Tower 1',
      location: 'Marina Boulevard, Singapore 018980',
      tokensOwned: 250,
      totalTokens: 10000,
      tokenPriceSGD: 120,
      totalValueSGD: 30000,
      monthlyYieldSGD: 187.50,
      roiPercentage: 7.5,
      category: 'Residential'
    },
    {
      id: 'SG-OCT-02',
      name: 'Orchard Central Commercial Suites',
      location: 'Orchard Road, Singapore 238896',
      tokensOwned: 500,
      totalTokens: 50000,
      tokenPriceSGD: 85,
      totalValueSGD: 42500,
      monthlyYieldSGD: 290.41,
      roiPercentage: 8.2,
      category: 'Commercial'
    },
    {
      id: 'SG-JUR-03',
      name: 'Jurong Innovation District Logistics Hub',
      location: 'Jurong West, Singapore 637142',
      tokensOwned: 1000,
      totalTokens: 100000,
      tokenPriceSGD: 45,
      totalValueSGD: 45000,
      monthlyYieldSGD: 337.50,
      roiPercentage: 9.0,
      category: 'Industrial'
    }
  ];

  const filteredAssets = selectedCategory === 'All'
    ? assets
    : assets.filter(a => a.category === selectedCategory);

  const totalPortfolioValueSGD = assets.reduce((sum, a) => sum + a.totalValueSGD, 0);
  const totalMonthlyYieldSGD = assets.reduce((sum, a) => sum + a.monthlyYieldSGD, 0);
  const averageROI = (assets.reduce((sum, a) => sum + a.roiPercentage, 0) / assets.length).toFixed(2);

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#38bdf8', margin: 0 }}>
            🇸🇬 Singapore Investor Portfolio Dashboard
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>
            Real-time tokenized asset holdings & yield statistics
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', background: '#1e293b', padding: '6px 12px', borderRadius: '20px', color: '#4ade80' }}>
            ● Network: Singapore Mainnet (SGD/XMR)
          </span>
        </div>
      </header>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #38bdf8' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Total Portfolio Value</span>
          <h2 style={{ fontSize: '24px', margin: '8px 0 0 0', color: '#f8fafc' }}>
            S${totalPortfolioValueSGD.toLocaleString()} SGD
          </h2>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #4ade80' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Est. Monthly Yield</span>
          <h2 style={{ fontSize: '24px', margin: '8px 0 0 0', color: '#4ade80' }}>
            S${totalMonthlyYieldSGD.toLocaleString(undefined, { minimumFractionDigits: 2 })} SGD
          </h2>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Average Annual ROI</span>
          <h2 style={{ fontSize: '24px', margin: '8px 0 0 0', color: '#f59e0b' }}>
            {averageROI}%
          </h2>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        {['All', 'Commercial', 'Residential', 'Industrial'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: selectedCategory === cat ? '#38bdf8' : '#1e293b',
              color: selectedCategory === cat ? '#0f172a' : '#94a3b8'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Holdings Table */}
      <div style={{ background: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#94a3b8', fontSize: '13px' }}>
              <th style={{ padding: '16px' }}>Property Name</th>
              <th style={{ padding: '16px' }}>Tokens Owned</th>
              <th style={{ padding: '16px' }}>Token Price</th>
              <th style={{ padding: '16px' }}>Total Holding Value</th>
              <th style={{ padding: '16px' }}>Est. Monthly Yield</th>
              <th style={{ padding: '16px' }}>ROI</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px' }}>
                  <strong>{asset.name}</strong>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{asset.location}</div>
                </td>
                <td style={{ padding: '16px' }}>{asset.tokensOwned} tokens</td>
                <td style={{ padding: '16px' }}>S${asset.tokenPriceSGD}</td>
                <td style={{ padding: '16px', fontWeight: '600', color: '#38bdf8' }}>
                  S${asset.totalValueSGD.toLocaleString()}
                </td>
                <td style={{ padding: '16px', color: '#4ade80' }}>
                  S${asset.monthlyYieldSGD.toFixed(2)}
                </td>
                <td style={{ padding: '16px', color: '#f59e0b' }}>
                  {asset.roiPercentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SingaporeUserDashboard;
