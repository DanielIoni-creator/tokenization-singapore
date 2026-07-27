// mobile/src/screens/WalletScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moneroService from '../services/moneroService';
import { COLORS } from '../constants/colors';

const WalletScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [balanceData, addressData, statusData] = await Promise.all([
        moneroService.getBalance(),
        moneroService.getAddress(),
        moneroService.getStatus(),
      ]);

      if (balanceData.success) {
        setBalance(balanceData.data.balance);
      }
      if (addressData.success) {
        setAddress(addressData.data.address);
      }
      if (statusData.success) {
        setStatus(statusData.data);
      }

      // Load transactions
      const txData = await moneroService.getTransactions(20);
      if (txData.success) {
        setTransactions(txData.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const formatBalance = (atomicBalance) => {
    return moneroService.formatXMR(atomicBalance);
  };

  const getStatusColor = (status) => {
    if (status === 'online') return COLORS.success;
    if (status === 'syncing') return COLORS.warning;
    return COLORS.danger;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Monero Wallet</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(status?.status) }]} />
          <Text style={styles.statusText}>{status?.status || 'Unknown'}</Text>
          <Text style={styles.networkText}>{status?.network || 'testnet'}</Text>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatBalance(balance)} XMR</Text>
        <Text style={styles.balanceSub}>
          ≈ €{(balance / 1e12 * 150).toFixed(2)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Receive')}
        >
          <Icon name="arrow-down-circle" size={32} color={COLORS.success} />
          <Text style={styles.actionLabel}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Send')}
        >
          <Icon name="arrow-up-circle" size={32} color={COLORS.danger} />
          <Text style={styles.actionLabel}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Icon name="list-circle" size={32} color={COLORS.info} />
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Address */}
      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Your Address</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>{address}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              // Copy to clipboard logic
              Alert.alert('Copied', 'Address copied to clipboard');
            }}
          >
            <Icon name="copy-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.slice(0, 5).map((tx, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <Icon
                  name={tx.type === 'incoming' ? 'arrow-down' : 'arrow-up'}
                  size={20}
                  color={tx.type === 'incoming' ? COLORS.success : COLORS.danger}
                />
                <View style={styles.txInfo}>
                  <Text style={styles.txAmount}>
                    {tx.type === 'incoming' ? '+' : '-'}{formatBalance(tx.amount)} XMR
                  </Text>
                  <Text style={styles.txStatus}>{tx.status || 'pending'}</Text>
                </View>
              </View>
              <Text style={styles.txDate}>
                {new Date(tx.timestamp).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginRight: 12,
  },
  networkText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  balanceCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 8,
  },
  balanceSub: {
    fontSize: 16,
    color: COLORS.gray,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.dark,
  },
  addressContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.dark,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 4,
  },
  transactionsSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txInfo: {
    marginLeft: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  txStatus: {
    fontSize: 12,
    color: COLORS.gray,
  },
  txDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

export default WalletScreen;
