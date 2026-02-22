import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

type VATRate = 23 | 8 | 5 | 0 | 'zw' | 'np' | 'oo';

interface TaxRateSelectorProps {
  selectedRate: VATRate;
  onRateChange: (rate: VATRate) => void;
  style?: any;
  label?: string;
  disabled?: boolean;
}

interface RateOption {
  value: VATRate;
  label: string;
  description: string;
}

const VAT_RATES: RateOption[] = [
  { value: 23, label: '23%', description: 'Stawka podstawowa' },
  { value: 8, label: '8%', description: 'Stawka obniżona (usługi budowlane, transport, żywność)' },
  { value: 5, label: '5%', description: 'Stawka obniżona (żywność podstawowa, książki, czasopisma)' },
  { value: 0, label: '0%', description: 'Stawka zerowa (eksport, WDT)' },
  { value: 'zw', label: 'zw', description: 'Zwolniony z VAT (art. 43 ust. 1 ustawy o VAT)' },
  { value: 'np', label: 'np', description: 'Nie podlega opodatkowaniu VAT' },
  { value: 'oo', label: 'oo', description: 'Odwrotne obciążenie (reverse charge)' },
];

const getSelectedRateOption = (rate: VATRate): RateOption => {
  return VAT_RATES.find((r) => r.value === rate) || VAT_RATES[0];
};

const TaxRateSelector: React.FC<TaxRateSelectorProps> = ({
  selectedRate,
  onRateChange,
  style,
  label = 'Stawka VAT',
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const selectedOption = getSelectedRateOption(selectedRate);

  const handleSelect = (rate: VATRate) => {
    onRateChange(rate);
    setIsModalVisible(false);
  };

  const renderRateItem = ({ item }: { item: RateOption }) => {
    const isSelected = item.value === selectedRate;
    return (
      <TouchableOpacity
        style={[styles.rateItem, isSelected && styles.rateItemSelected]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.7}
      >
        <View style={styles.rateItemLeft}>
          <View style={[styles.rateBadge, isSelected && styles.rateBadgeSelected]}>
            <Text style={[styles.rateBadgeText, isSelected && styles.rateBadgeTextSelected]}>
              {item.label}
            </Text>
          </View>
          <Text style={[styles.rateDescription, isSelected && styles.rateDescriptionSelected]}>
            {item.description}
          </Text>
        </View>
        {isSelected && (
          <Icon name="check" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setIsModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>{selectedOption.label}</Text>
          </View>
          <Text style={styles.selectedDescription} numberOfLines={1}>
            {selectedOption.description}
          </Text>
        </View>
        <Icon name="arrow-drop-down" size={24} color={disabled ? '#ccc' : '#666'} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz stawkę VAT</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={VAT_RATES}
              keyExtractor={(item) => String(item.value)}
              renderItem={renderRateItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  selectedBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rateItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  rateItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rateBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 48,
    alignItems: 'center',
  },
  rateBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  rateBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  rateBadgeTextSelected: {
    color: '#fff',
  },
  rateDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  rateDescriptionSelected: {
    color: '#333',
    fontWeight: '500',
  },
});

export default TaxRateSelector;
