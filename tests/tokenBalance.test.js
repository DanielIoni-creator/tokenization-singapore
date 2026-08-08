'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const web3 = require('../utils/web3');
const priceService = require('../utils/priceService');
const controller = require('../controllers/tokenController');

test('isValidAddress accepts checksummed lowercase addresses', () => {
  assert.equal(
    web3.isValidAddress('0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'),
    true
  );
  assert.equal(
    web3.isValidAddress('0x6B3595068778DD592E39A122F4F5A5CF09C90FE2'),
    true
  );
  assert.equal(web3.isValidAddress('0x6b3595068778dd592e39a122f4f5a5cf09c90fe'), false);
  assert.equal(web3.isValidAddress('not-an-address'), false);
  assert.equal(web3.isValidAddress(''), false);
  assert.equal(web3.isValidAddress(null), false);
  assert.equal(web3.isValidAddress(42), false);
});

test('normalizeAddress lowercases strings', () => {
  assert.equal(
    web3.normalizeAddress('0x6B3595068778DD592E39A122F4F5A5CF09C90FE2'),
    '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
  );
});

test('formatUnits handles zero, decimals, and rounding', () => {
  assert.equal(web3.formatUnits(0n, 18), '0');
  assert.equal(web3.formatUnits(1n, 0), '1');
  assert.equal(web3.formatUnits('1000000000000000000', 18), '1');
  assert.equal(web3.formatUnits('1500000000000000000', 18), '1.5');
  assert.equal(web3.formatUnits('1000000000000000001', 18), '1.000000000000000001');
  assert.equal(web3.formatUnits('123456789', 6), '123.456789');
  assert.equal(web3.formatUnits('123450000', 6), '123.45');
  assert.equal(web3.formatUnits('0', 6), '0');
});

test('formatUnits handles negative balances defensively', () => {
  // ERC-20 should never go negative, but uint256 overflow produces them;
  // ensure we emit a minus instead of silently wrapping.
  assert.equal(web3.formatUnits(-1n, 0), '-1');
  assert.equal(web3.formatUnits(-1500000000000000000n, 18), '-1.5');
});

test('pad32 left-pads hex body to 32 bytes', () => {
  const padded = web3.pad32('1234');
  assert.equal(padded.length, 64);
  assert.equal(padded.endsWith('1234'), true);
  assert.equal(
    padded,
    '0000000000000000000000000000000000000000000000000000000000001234'
  );
});

test('formatCurrency renders USD and SGD', () => {
  // Use a regex so we don't lock to a specific ICU version. The contract is
  // "non-null string containing the numeric amount with currency suffix".
  const usd = controller.formatCurrency(1.5, 'USD');
  const sgd = controller.formatCurrency(1.5, 'SGD');
  assert.match(usd, /1\.50/);
  assert.match(sgd, /1\.50/);
  // USD prefix should appear at least once in the USD output.
  assert.match(usd, /US\$|\$|USD/);
  // SGD output should reference SGD (either symbol or code).
  assert.match(sgd, /SG\$|SGD|S\$/);
  assert.equal(controller.formatCurrency(null, 'USD'), null);
  assert.equal(controller.formatCurrency(undefined, 'USD'), null);
  assert.equal(controller.formatCurrency(Number.NaN, 'USD'), null);
});

test('calculateValue multiplies finite numbers and rejects bad inputs', () => {
  assert.equal(controller.calculateValue('2', '3.5'), 7);
  assert.equal(controller.calculateValue(0, 100), 0);
  assert.equal(controller.calculateValue('abc', 1), null);
  assert.equal(controller.calculateValue(1, null), null);
  assert.equal(controller.calculateValue(Infinity, 1), null);
});

test('decodeString handles dynamic strings, bytes32, and empty payloads', () => {
  const dynamic =
    '0x' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000005' +
    Buffer.from('hello').toString('hex');
  assert.equal(web3.decodeString(dynamic), 'hello');

  const bytes32 =
    '0x' +
    Buffer.from('USDC').toString('hex').padEnd(64, '0');
  assert.equal(web3.decodeString(bytes32), 'USDC');

  assert.equal(web3.decodeString('0x'), '');
  assert.equal(web3.decodeString(''), '');
  assert.equal(web3.decodeString(null), '');
});

test('decodeUint256 parses hex uints and tolerates zero', () => {
  assert.equal(web3.decodeUint256('0x0'), 0n);
  assert.equal(web3.decodeUint256('0xff'), 255n);
  assert.equal(web3.decodeUint256(null), 0n);
});

test('getTokenPrices returns a map keyed by lowercased address', async () => {
  const tokens = [
    {
      contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC'
    }
  ];

  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { usd: 1, sgd: 1.35 }
    })
  });

  const map = await priceService.getTokenPrices(tokens, { fetchImpl: fakeFetch });
  assert.equal(map.size, 1);
  assert.deepEqual(map.get('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), {
    usd: 1,
    sgd: 1.35,
    source: 'coingecko'
  });
});

test('getTokenPrices falls back to configured data when fetch is unavailable', async () => {
  const previous = process.env.TOKEN_PRICE_DATA_JSON;
  process.env.TOKEN_PRICE_DATA_JSON = JSON.stringify({
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa': { usd: 2, sgd: 2.7 }
  });
  delete process.env.USD_SGD_RATE;

  try {
    const tokens = [
      {
        contractAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        symbol: 'FOO'
      }
    ];
    const map = await priceService.getTokenPrices(tokens, {
      fetchImpl: async () => {
        throw new Error('network down');
      }
    });
    assert.equal(map.size, 1);
    const entry = map.get('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.equal(entry.usd, 2);
    assert.equal(entry.sgd, 2.7);
    assert.equal(entry.source, 'configured');
  } finally {
    if (previous === undefined) {
      delete process.env.TOKEN_PRICE_DATA_JSON;
    } else {
      process.env.TOKEN_PRICE_DATA_JSON = previous;
    }
  }
});

test('getTokenPrices derives SGD from USD when rate is configured', async () => {
  const previousRate = process.env.USD_SGD_RATE;
  process.env.USD_SGD_RATE = '1.4';
  try {
    const tokens = [
      { contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', symbol: 'BAR' }
    ];
    const map = await priceService.getTokenPrices(tokens, {
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb': { usd: 1, sgd: null }
        })
      })
    });
    const entry = map.get('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    assert.equal(entry.usd, 1);
    assert.equal(entry.sgd, 1.4);
    assert.equal(entry.source, 'coingecko');
  } finally {
    if (previousRate === undefined) {
      delete process.env.USD_SGD_RATE;
    } else {
      process.env.USD_SGD_RATE = previousRate;
    }
  }
});

test('getTokenPrices emits unavailable marker when both remote and config are empty', async () => {
  const tokens = [
    { contractAddress: '0xcccccccccccccccccccccccccccccccccccccccc', symbol: 'BAZ' }
  ];
  const map = await priceService.getTokenPrices(tokens, {
    fetchImpl: async () => ({ ok: false, json: async () => ({}) })
  });
  const entry = map.get('0xcccccccccccccccccccccccccccccccccccccccc');
  assert.equal(entry.usd, null);
  assert.equal(entry.sgd, null);
  assert.equal(entry.source, 'unavailable');
});

test('getTokenPrices tolerates an empty token list', async () => {
  const map = await priceService.getTokenPrices([], {});
  assert.equal(map.size, 0);
});