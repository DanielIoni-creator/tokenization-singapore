import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getTokens } from '../store/tokenSlice';
import { COLORS } from '../constants/colors';

const TokenListScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const dispatch = useDispatch();
  const { items: tokens, isLoading } = useSelector((state) => state.tokens);

  useEffect(() => {
    dispatch(getTokens());
  }, []);

  const filteredTokens = tokens?.filter((token) =>
    token.name?.toLowerCase().includes(search.toLowerCase()) ||
    token.symbol?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const renderToken = ({ item }) => (
    <TouchableOpacity
      style={styles.tokenCard}
      onPress={() => navigation.navigate('TokenDetail', { id: item._id })}
    >
      <View style={styles.tokenHeader}>
        <Text style={styles.tokenName}>{item.name}</Text>
        <Text style={styles.tokenSymbol}>{item.symbol}</Text>
      </View>
      <View style={styles.tokenDetails}>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenPrice}>S${item.tokenPrice}</Text>
          <Text style={styles.tokenSupply}>{item.totalSupply} tokens</Text>
        </View>
        <View style={styles.tokenStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? COLORS.success : COLORS.warning }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tokens..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredTokens}
        renderItem={renderToken}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    backgroundColor: COLORS.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  tokenCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  tokenSymbol: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  tokenDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 12,
  },
  tokenSupply: {
    fontSize: 12,
    color: COLORS.gray,
  },
  tokenStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.gray,
  },
});

export default TokenListScreen;
