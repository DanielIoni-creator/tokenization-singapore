import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../store/orderSlice';
import { getTokens } from '../store/tokenSlice';
import { COLORS } from '../constants/colors';

const OrderScreen = ({ navigation }) => {
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('1');
  const dispatch = useDispatch();
  const { items: tokens, isLoading: tokensLoading } = useSelector((state) => state.tokens);
  const { isLoading: orderLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getTokens());
  }, []);

  const handleCreateOrder = async () => {
    const tokenAmount = parseInt(amount);
    if (!tokenId) {
      Alert.alert('Error', 'Please select a token');
      return;
    }
    if (!tokenAmount || tokenAmount < 1) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await dispatch(createOrder({
        tokenId,
        amount: tokenAmount,
        paymentMethod: 'monero'
      })).unwrap();

      Alert.alert('Success', 'Order created successfully!');
      navigation.navigate('Orders');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create order');
    }
  };

  const selectedToken = tokens?.find(t => t._id === tokenId);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Order</Text>
        <Text style={styles.subtitle}>Invest in tokenized real estate</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Token</Text>
          <View style={styles.tokenList}>
            {tokens?.map((token) => (
              <TouchableOpacity
                key={token._id}
                style={[
                  styles.tokenOption,
                  tokenId === token._id && styles.tokenOptionSelected
                ]}
                onPress={() => setTokenId(token._id)}
              >
                <Text style={[
                  styles.tokenOptionText,
                  tokenId === token._id && styles.tokenOptionTextSelected
                ]}>
                  {token.symbol} - {token.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount (tokens)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            editable={!orderLoading}
          />
        </View>

        {selectedToken && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Token</Text>
              <Text style={styles.summaryValue}>{selectedToken.symbol}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price per token</Text>
              <Text style={styles.summaryValue}>S${selectedToken.tokenPrice}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>{amount}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.summaryLabel}>Total Price</Text>
              <Text style={styles.totalValue}>
                S${(parseInt(amount) || 0) * selectedToken.tokenPrice}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, orderLoading && styles.createButtonDisabled]}
          onPress={handleCreateOrder}
          disabled={orderLoading}
        >
          {orderLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Order</Text>
          )}
        </TouchableOpacity>
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
  title: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  tokenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tokenOption: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  tokenOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  tokenOptionText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  tokenOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  summary: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  createButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderScreen;
