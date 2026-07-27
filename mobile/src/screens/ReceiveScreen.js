// mobile/src/screens/ReceiveScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import moneroService from '../services/moneroService';
import { COLORS } from '../constants/colors';

const ReceiveScreen = () => {
  const [label, setLabel] = useState('');
  const [subaddress, setSubaddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSubaddress = async () => {
    try {
      setLoading(true);
      const result = await moneroService.generateSubaddress(label || 'receive');
      if (result.success) {
        setSubaddress(result.data.subaddress);
        Alert.alert('Success', 'Subaddress generated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate subaddress');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    Alert.alert('Copied', 'Address copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receive Monero</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.addressContainer}>
          <Text style={styles.label}>Your Address</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>
              {subaddress || 'Generate a subaddress to receive'}
            </Text>
            {subaddress && (
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(subaddress)}
              >
                <Icon name="copy-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {subaddress && (
          <View style={styles.qrContainer}>
            <QRCode
              value={subaddress}
              size={200}
              color={COLORS.primary}
              backgroundColor="white"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Label (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., order-001"
            value={label}
            onChangeText={setLabel}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.buttonDisabled]}
          onPress={generateSubaddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.generateButtonText}>
              {subaddress ? 'Generate New' : 'Generate Subaddress'}
            </Text>
          )}
        </TouchableOpacity>

        {subaddress && (
          <View style={styles.infoBox}>
            <Icon name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.infoText}>
              This address is unique for this transaction. Funds sent to this address will appear in your wallet.
            </Text>
          </View>
        )}
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
  addressContainer: {
    marginBottom: 20,
  },
  label: {
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
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 20,
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
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.light + '40',
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.gray,
  },
});

export default ReceiveScreen;
