import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface VATRegisterItem {
  id: string;
  type: 'sprzedaz' | 'zakup';
  counterpartyName: string;
  counterpartyNIP?: string;
  invoiceNumber: string;
  invoiceDate: string;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  gtuCode?: string;
}

const VATRegisterScreen = ({ navigation }: any) => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { token } = useSelector((state: RootState) => state.auth as any);
  const [registers, setRegisters] = useState<VATRegisterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sprzedaz' | 'zakup'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-10');

  useEffect(() => {
    if (currentCompany) {
      loadVATRegisters();
    }
  }, [currentCompany, selectedPeriod, filter]);

  const loadVATRegisters = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/declarations/vat-register/${selectedPeriod}/${currentCompany.id}${filter !== 'all' ? `?type=${filter}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRegisters(data.data);
        }
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się załadować rejestru VAT');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVATRegisters();
    setRefreshing(false);
  };

  const getTypeText = (type: string) => {
    return type === 'sprzedaz' ? 'Sprzedaż' : 'Zakup';
  };

  const getTypeColor = (type: string) => {
    return type === 'sprzedaz' ? '#28A745' : '#007AFF';
  };

  const renderRegisterItem = ({ item }: { item: VATRegisterItem }) => (
    <TouchableOpacity style={styles.registerItem}>
      <View style={styles.registerHeader}>
        <View style={styles.typeContainer}>
          <Text style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
            {getTypeText(item.type)}
          </Text>
        </View>
        <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
      </View>

      <View style={styles.registerDetails}>
        <Text style={styles.counterpartyName}>{item.counterpartyName}</Text>
        {item.counterpartyNIP && (
          <Text style={styles.counterpartyNIP}>NIP: {item.counterpartyNIP}</Text>
        )}
        <Text style={styles.invoiceDate}>
          Data: {new Date(item.invoiceDate).toLocaleDateString('pl-PL')}
        </Text>
      </View>

      <View style={styles.amountsContainer}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Netto</Text>
          <Text style={styles.amountValue}>{item.netAmount.toFixed(2)} zł</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>VAT ({item.vatRate}%)</Text>
          <Text style={styles.amountValue}>{item.vatAmount.toFixed(2)} zł</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Brutto</Text>
          <Text style={[styles.amountValue, styles.totalAmount]}>
            {(item.netAmount + item.vatAmount).toFixed(2)} zł
          </Text>
        </View>
      </View>

      {item.gtuCode && (
        <Text style={styles.gtuCode}>GTU: {item.gtuCode}</Text>
      )}
    </TouchableOpacity>
  );

  const renderSummary = () => {
    const sales = registers.filter(reg => reg.type === 'sprzedaz');
    const purchases = registers.filter(reg => reg.type === 'zakup');

    const totalSalesNet = sales.reduce((sum, reg) => sum + reg.netAmount, 0);
    const totalSalesVAT = sales.reduce((sum, reg) => sum + reg.vatAmount, 0);
    const totalPurchasesNet = purchases.reduce((sum, reg) => sum + reg.netAmount, 0);
    const totalPurchasesVAT = purchases.reduce((sum, reg) => sum + reg.vatAmount, 0);

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Podsumowanie okresu {selectedPeriod}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sprzedaż netto:</Text>
          <Text style={[styles.summaryValue, { color: '#28A745' }]}>
            {totalSalesNet.toFixed(2)} zł
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>VAT należny:</Text>
          <Text style={[styles.summaryValue, { color: '#28A745' }]}>
            {totalSalesVAT.toFixed(2)} zł
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Zakup netto:</Text>
          <Text style={[styles.summaryValue, { color: '#007AFF' }]}>
            {totalPurchasesNet.toFixed(2)} zł
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>VAT naliczony:</Text>
          <Text style={[styles.summaryValue, { color: '#007AFF' }]}>
            {totalPurchasesVAT.toFixed(2)} zł
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.summaryLabel, styles.totalLabel]}>VAT do zapłaty:</Text>
          <Text style={[styles.summaryValue, styles.totalValue]}>
            {(totalSalesVAT - totalPurchasesVAT).toFixed(2)} zł
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie rejestru VAT...</Text>
      </View>
    );
  }

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="business" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Wybierz firmę, aby zobaczyć rejestr VAT</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rejestr VAT</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddVATEntry')}
        >
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <Text style={styles.periodLabel}>Okres:</Text>
        <TextInput
          style={styles.periodInput}
          value={selectedPeriod}
          onChangeText={setSelectedPeriod}
          placeholder="YYYY-MM"
          maxLength={7}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>
            Wszystkie
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'sprzedaz' && styles.activeFilterTab]}
          onPress={() => setFilter('sprzedaz')}
        >
          <Text style={[styles.filterTabText, filter === 'sprzedaz' && styles.activeFilterTabText]}>
            Sprzedaż
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'zakup' && styles.activeFilterTab]}
          onPress={() => setFilter('zakup')}
        >
          <Text style={[styles.filterTabText, filter === 'zakup' && styles.activeFilterTabText]}>
            Zakup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {registers.length > 0 && renderSummary()}

      {/* Register List */}
      {registers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={48} color="#CCC" />
          <Text style={styles.emptyText}>Brak wpisów w rejestrze VAT</Text>
          <Text style={styles.emptySubtext}>
            Dodaj pierwszą fakturę do rejestru VAT
          </Text>
        </View>
      ) : (
        <FlatList
          data={registers}
          renderItem={renderRegisterItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 12,
  },
  periodInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterTabText: {
    color: '#FFF',
  },
  summaryContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalLabel: {
    fontWeight: '600',
    color: '#333',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContainer: {
    padding: 16,
  },
  registerItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  registerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  registerDetails: {
    marginBottom: 12,
  },
  counterpartyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  counterpartyNIP: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 12,
    color: '#999',
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalAmount: {
    fontWeight: '600',
    color: '#007AFF',
  },
  gtuCode: {
    fontSize: 12,
    color: '#FFA500',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default VATRegisterScreen;