import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getTokens } from '../store/tokenSlice';
import { getPortfolio } from '../store/portfolioSlice';
import { COLORS, THEME } from '../constants/colors';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: tokens, isLoading: tokensLoading } = useSelector((state) => state.tokens);
  const { portfolio, isLoading: portfolioLoading } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(getTokens());
    dispatch(getPortfolio());
  }, []);

  const totalInvested = portfolio?.totalInvested || 0;
  const totalReturns = portfolio?.totalReturns || 0;
  const tokenCount = tokens?.length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || user?.username || 'Investor'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalInvested.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${totalReturns.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Returns</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tokenCount}</Text>
          <Text style={styles.statLabel}>Tokens Available</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Tokens')}
          >
            <Text style={styles.actionIcon}>🏢</Text>
            <Text style={styles.actionLabel}>Browse Tokens</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>My Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionLabel}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tokens</Text>
        {tokens?.slice(0, 3).map((token) => (
          <TouchableOpacity
            key={token._id}
            style={styles.tokenItem}
            onPress={() => navigation.navigate('TokenDetail', { id: token._id })}
          >
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{token.name}</Text>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            </View>
            <Text style={styles.tokenPrice}>S${token.tokenPrice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  welcome: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.8,
  },
  userName: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  tokenSymbol: {
    fontSize: 14,
    color: COLORS.gray,
  },
  tokenPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default HomeScreen;
