// mobile/src/screens/SendScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moneroService from '../services/moneroService';
import { COLORS } from '../constants/colors';

const SendScreen = ({ navigation }) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const validateAddress = (addr) => {
    return moneroService.isValidAddress(addr);
  };

  const handleSend = async () => {
    if (!address) {
      Alert.alert('Error', 'Please enter a valid Monero address');
      return;
    }

    if (!validateAddress(address)) {
      Alert.alert('Error', 'Invalid Monero address format');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Confirm Transaction',
      `Send ${amountNum} XMR to ${address.slice(0, 16)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => executeSend() },
      ]
    );
  };

  const executeSend = async () => {
    try {
      setLoading(true);
      const result = await moneroService.sendPayment(
        address,
        parseFloat(amount) * 1e12, // Convert to atomic units
        priority
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Transaction sent successfully!\nTx Hash: ${result.data.txHash}`,
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send Monero</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={[styles.input, address && styles.inputFilled]}
            placeholder="Enter Monero address (starts with 4 or 8)"
            value={address}
            onChangeText={setAddress}
            multiline
            editable={!loading}
          />
          {address && (
            <View style={styles.validationIndicator}>
              <Icon
                name={validateAddress(address) ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={validateAddress(address) ? COLORS.success : COLORS.danger}
              />
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (XMR)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {['low', 'normal', 'high'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && styles.prioritySelected,
                ]}
                onPress={() => setPriority(p)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === p && styles.priorityTextSelected,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.sendButtonText}>Send XMR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
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
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  inputFilled: {
    borderColor: COLORS.primary,
  },
  validationIndicator: {
    position: 'absolute',
    right: 12,
    top: 40,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  prioritySelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  priorityText: {
    color: COLORS.gray,
  },
  priorityTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SendScreen;
