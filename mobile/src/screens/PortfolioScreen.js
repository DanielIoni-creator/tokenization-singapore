import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getPortfolio, getPerformance } from '../store/portfolioSlice';
import { COLORS } from '../constants/colors';

const PortfolioScreen = () => {
  const dispatch = useDispatch();
  const { portfolio, performance, isLoading } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(getPortfolio());
    dispatch(getPerformance());
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalInvested = portfolio?.totalInvested || 0;
  const totalReturns = portfolio?.totalReturns || 0;
  const tokenCount = portfolio?.tokens?.length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>S${totalInvested.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Invested</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: totalReturns >= 0 ? COLORS.success : COLORS.danger }]}>
            {totalReturns >= 0 ? '+' : ''}S${totalReturns.toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>Total Returns</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{tokenCount}</Text>
          <Text style={styles.summaryLabel}>Tokens Held</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Tokens</Text>
        {portfolio?.tokens?.map((token, index) => (
          <View key={index} style={styles.tokenItem}>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenName}>{token.symbol}</Text>
              <Text style={styles.tokenAmount}>{token.amount} tokens</Text>
            </View>
            <View style={styles.tokenValue}>
              <Text style={styles.tokenPrice}>S${token.value}</Text>
            </View>
          </View>
        ))}
        {(!portfolio?.tokens || portfolio.tokens.length === 0) && (
          <Text style={styles.emptyText}>No tokens in portfolio yet</Text>
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
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
  },
  section: {
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginRight: 12,
  },
  tokenAmount: {
    fontSize: 14,
    color: COLORS.gray,
  },
  tokenValue: {
    justifyContent: 'center',
  },
  tokenPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 16,
    marginTop: 20,
  },
});

export default PortfolioScreen;
