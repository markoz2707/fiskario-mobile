import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface NIPValidatorProps {
  value: string;
  onChangeText: (text: string) => void;
  onValidation: (isValid: boolean) => void;
  style?: any;
  label?: string;
  placeholder?: string;
  autoFormat?: boolean;
}

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

const stripNIP = (nip: string): string => {
  return nip.replace(/[^0-9]/g, '');
};

const formatNIP = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
};

const validateNIP = (nip: string): boolean => {
  const digits = stripNIP(nip);
  if (digits.length !== 10) return false;

  const nums = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += nums[i] * NIP_WEIGHTS[i];
  }

  const checkDigit = sum % 11;
  // If checkDigit is 10, the NIP is invalid
  if (checkDigit === 10) return false;

  return checkDigit === nums[9];
};

const NIPValidator: React.FC<NIPValidatorProps> = ({
  value,
  onChangeText,
  onValidation,
  style,
  label = 'NIP',
  placeholder = 'Wpisz NIP (np. 123-456-78-90)',
  autoFormat = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const digits = stripNIP(value);
  const hasInput = digits.length > 0;

  const handleChangeText = useCallback((text: string) => {
    const cleaned = stripNIP(text);
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    const output = autoFormat ? formatNIP(limited) : limited;
    onChangeText(output);
  }, [autoFormat, onChangeText]);

  useEffect(() => {
    if (digits.length === 0) {
      setValidationState('idle');
      onValidation(false);
    } else if (digits.length === 10) {
      const isValid = validateNIP(digits);
      setValidationState(isValid ? 'valid' : 'invalid');
      onValidation(isValid);
    } else {
      setValidationState('invalid');
      onValidation(false);
    }
  }, [digits, onValidation]);

  const getBorderColor = (): string => {
    if (!hasInput) return isFocused ? '#007AFF' : '#ddd';
    if (validationState === 'valid') return '#4CAF50';
    if (validationState === 'invalid' && digits.length === 10) return '#F44336';
    return isFocused ? '#007AFF' : '#ddd';
  };

  const getStatusIcon = () => {
    if (!hasInput || digits.length < 10) return null;

    if (validationState === 'valid') {
      return <Icon name="check-circle" size={24} color="#4CAF50" style={styles.statusIcon} />;
    }
    if (validationState === 'invalid') {
      return <Icon name="cancel" size={24} color="#F44336" style={styles.statusIcon} />;
    }
    return null;
  };

  const getStatusMessage = (): string | null => {
    if (!hasInput) return null;
    if (digits.length < 10) return `NIP musi mieć 10 cyfr (wpisano: ${digits.length})`;
    if (validationState === 'valid') return 'NIP jest poprawny';
    if (validationState === 'invalid') return 'NIP jest niepoprawny - błędna suma kontrolna';
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        <Icon name="business" size={20} color="#666" style={styles.prefixIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={autoFormat ? 13 : 10}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={false}
        />
        {getStatusIcon()}
      </View>
      {statusMessage && (
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              {
                color:
                  validationState === 'valid'
                    ? '#4CAF50'
                    : validationState === 'invalid' && digits.length === 10
                    ? '#F44336'
                    : '#999',
              },
            ]}
          >
            {statusMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  prefixIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    letterSpacing: 1,
  },
  statusIcon: {
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default NIPValidator;
