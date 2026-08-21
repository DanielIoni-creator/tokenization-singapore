import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { getPortfolio, getPerformance } from '../store/portfolioSlice';
import { getTokens } from '../store/tokenSlice';
import { COLORS } from '../constants/colors';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => `S$${Math.round(toNumber(value)).toLocaleString()}`;

const percent = (value) => `${toNumber(value).toFixed(1)}%`;

const firstFiniteValue = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;

    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }

  return 0;
};

const getTokenValue = (token) => {
  const tokenDetails = token.tokenId && typeof token.tokenId === 'object' ? token.tokenId : {};

  return firstFiniteValue(
    token.value,
    token.marketValue,
    token.currentValue,
    toNumber(token.amount) * firstFiniteValue(
      token.tokenPrice,
      token.price,
      tokenDetails.tokenPrice,
      tokenDetails.price,
    ),
  );
};

const getPropertyLabel = (token) => {
  const tokenDetails = token.tokenId && typeof token.tokenId === 'object' ? token.tokenId : {};
  const propertyDetails = token.propertyDetails || tokenDetails.propertyDetails;

  return (
    propertyDetails?.address?.buildingName ||
    propertyDetails?.address?.street ||
    token.propertyName ||
    tokenDetails.propertyName ||
    token.name ||
    tokenDetails.name ||
    token.symbol ||
    tokenDetails.symbol ||
    'Singapore property'
  );
};

const SingaporeDashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: tokens, isLoading: tokensLoading } = useSelector((state) => state.tokens);
  const { portfolio, performance, isLoading: portfolioLoading } = useSelector((state) => state.portfolio);

  useEffect(() => {
    dispatch(getTokens());
    dispatch(getPortfolio());
    dispatch(getPerformance());
  }, [dispatch]);

  const dashboard = useMemo(() => {
    const availableTokens = Array.isArray(tokens) ? tokens : [];
    const heldTokens = Array.isArray(portfolio?.tokens) ? portfolio.tokens : [];
    const totalInvested = toNumber(portfolio?.totalInvested);
    const totalReturns = toNumber(portfolio?.totalReturns);
    const holdingsValue = heldTokens.reduce((sum, token) => sum + getTokenValue(token), 0);
    const portfolioValue = heldTokens.length > 0 ? holdingsValue : totalInvested + totalReturns;
    const returnRate = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    const availableProperties = new Set(availableTokens.map(getPropertyLabel)).size;
    const heldProperties = new Set(heldTokens.map(getPropertyLabel)).size;
    const topHoldings = heldTokens
      .map((token) => ({
        ...token,
        label: getPropertyLabel(token),
        value: getTokenValue(token),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
    const maxHolding = Math.max(...topHoldings.map((token) => token.value), 1);
    const performancePoints = Array.isArray(performance?.history)
      ? performance.history.slice(-6)
      : [];
    const maxPerformance = Math.max(...performancePoints.map((item) => toNumber(item.value)), 1);

    return {
      availableProperties,
      availableTokens: availableTokens.length,
      heldProperties,
      heldTokens: heldTokens.length,
      portfolioValue,
      returnRate,
      topHoldings,
      maxHolding,
      performancePoints,
      maxPerformance,
      totalInvested,
      totalReturns,
    };
  }, [tokens, portfolio, performance]);

  const isLoading = (tokensLoading || portfolioLoading) && dashboard.availableTokens === 0 && dashboard.heldTokens === 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroLabel}>Singapore dashboard</Text>
          <Text style={styles.heroTitle}>{formatCurrency(dashboard.portfolioValue)}</Text>
          <Text style={styles.heroSubtitle}>Current portfolio value</Text>
        </View>
        <View style={[styles.returnBadge, dashboard.totalReturns < 0 && styles.returnBadgeNegative]}>
          <Icon
            name={dashboard.totalReturns >= 0 ? 'trending-up' : 'trending-down'}
            color={dashboard.totalReturns >= 0 ? COLORS.success : COLORS.danger}
            size={18}
          />
          <Text style={[styles.returnText, dashboard.totalReturns < 0 && styles.returnTextNegative]}>
            {percent(dashboard.returnRate)}
          </Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{dashboard.heldTokens}</Text>
          <Text style={styles.metricLabel}>Tokens held</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{dashboard.heldProperties}</Text>
          <Text style={styles.metricLabel}>Properties</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatCurrency(dashboard.totalInvested)}</Text>
          <Text style={styles.metricLabel}>Invested</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, dashboard.totalReturns < 0 && styles.negativeValue]}>
            {formatCurrency(dashboard.totalReturns)}
          </Text>
          <Text style={styles.metricLabel}>Returns</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Portfolio allocation</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Portfolio')}>
            <Text style={styles.linkText}>Open portfolio</Text>
          </TouchableOpacity>
        </View>
        {dashboard.topHoldings.length > 0 ? (
          dashboard.topHoldings.map((token, index) => (
            <View key={`${token.symbol || token.label}-${index}`} style={styles.holdingRow}>
              <View style={styles.holdingInfo}>
                <Text style={styles.holdingName} numberOfLines={1}>{token.label}</Text>
                <Text style={styles.holdingMeta}>{token.symbol || 'Token'} - {toNumber(token.amount)} units</Text>
              </View>
              <View style={styles.holdingChart}>
                <View
                  style={[
                    styles.holdingBar,
                    { width: `${Math.max((token.value / dashboard.maxHolding) * 100, 8)}%` },
                  ]}
                />
              </View>
              <Text style={styles.holdingValue}>{formatCurrency(token.value)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="pie-chart-outline" color={COLORS.gray} size={26} />
            <Text style={styles.emptyText}>No Singapore property holdings yet</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Investment trend</Text>
          <Text style={styles.mutedText}>Last 6 periods</Text>
        </View>
        {dashboard.performancePoints.length > 0 ? (
          <View style={styles.trendChart}>
            {dashboard.performancePoints.map((point, index) => (
              <View key={`${point.label || point.date || index}`} style={styles.trendColumn}>
                <View style={styles.trendTrack}>
                  <View
                    style={[
                      styles.trendBar,
                      { height: `${Math.max((toNumber(point.value) / dashboard.maxPerformance) * 100, 10)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>{point.label || point.month || `${index + 1}`}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.trendPlaceholder}>
            <View style={[styles.placeholderBar, { height: 42 }]} />
            <View style={[styles.placeholderBar, { height: 64 }]} />
            <View style={[styles.placeholderBar, { height: 52 }]} />
            <View style={[styles.placeholderBar, { height: 88 }]} />
            <View style={[styles.placeholderBar, { height: 76 }]} />
            <View style={[styles.placeholderBar, { height: 96 }]} />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Market overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tokens')}>
            <Text style={styles.linkText}>Browse tokens</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.marketRow}>
          <View style={styles.marketItem}>
            <Icon name="business-outline" color={COLORS.primary} size={22} />
            <View>
              <Text style={styles.marketValue}>{dashboard.availableProperties}</Text>
              <Text style={styles.marketLabel}>listed properties</Text>
            </View>
          </View>
          <View style={styles.marketItem}>
            <Icon name="analytics-outline" color={COLORS.primary} size={22} />
            <View>
              <Text style={styles.marketValue}>{dashboard.availableTokens}</Text>
              <Text style={styles.marketLabel}>token offerings</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  content: {
    paddingBottom: 96,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingHorizontal: 22,
    paddingTop: 34,
  },
  heroLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.78,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  heroSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  returnBadge: {
    alignItems: 'center',
    backgroundColor: '#e8f8ef',
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  returnBadgeNegative: {
    backgroundColor: '#fdecec',
  },
  returnText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  returnTextNegative: {
    color: COLORS.danger,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 14,
    width: '48%',
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: 'bold',
  },
  negativeValue: {
    color: COLORS.danger,
  },
  metricLabel: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  mutedText: {
    color: COLORS.gray,
    fontSize: 12,
  },
  holdingRow: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  holdingInfo: {
    flex: 1.3,
    marginRight: 10,
  },
  holdingName: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  holdingMeta: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 3,
  },
  holdingChart: {
    backgroundColor: '#eef2f5',
    borderRadius: 4,
    flex: 1,
    height: 8,
    marginRight: 10,
    overflow: 'hidden',
  },
  holdingBar: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    height: 8,
  },
  holdingValue: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 20,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 8,
  },
  trendChart: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    flexDirection: 'row',
    height: 150,
    justifyContent: 'space-between',
    padding: 16,
  },
  trendColumn: {
    alignItems: 'center',
    flex: 1,
  },
  trendTrack: {
    backgroundColor: '#eef2f5',
    borderRadius: 5,
    height: 108,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 14,
  },
  trendBar: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    width: 14,
  },
  trendLabel: {
    color: COLORS.gray,
    fontSize: 10,
    marginTop: 8,
  },
  trendPlaceholder: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    flexDirection: 'row',
    height: 150,
    justifyContent: 'space-around',
    padding: 18,
  },
  placeholderBar: {
    backgroundColor: '#dfe7ed',
    borderRadius: 6,
    width: 18,
  },
  marketRow: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  marketItem: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '48%',
  },
  marketValue: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  marketLabel: {
    color: COLORS.gray,
    fontSize: 11,
    marginLeft: 10,
    marginTop: 2,
  },
});

export default SingaporeDashboardScreen;
