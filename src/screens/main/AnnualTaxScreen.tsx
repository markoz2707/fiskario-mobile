import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { RootState } from '../../store';
import {
  useGetAnnualReturnsQuery,
  useCreateAnnualReturnMutation,
  useCalculateAnnualTaxMutation,
  useGetAnnualTaxSummaryQuery,
} from '../../store/api/apiSlice';

interface AnnualReturn {
  id: string;
  formType: string;
  year: number;
  status: 'DRAFT' | 'CALCULATING' | 'READY' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  taxAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface TaxSummary {
  revenue: number;
  costs: number;
  income: number;
  tax: number;
  advancesPaid: number;
  toPayOrRefund: number;
}

const YEARS = [2026, 2025, 2024, 2023];

const FORM_TYPES = [
  { value: 'PIT-36', label: 'PIT-36 (Skala podatkowa)' },
  { value: 'PIT-36L', label: 'PIT-36L (Podatek liniowy)' },
  { value: 'PIT-28', label: 'PIT-28 (Ryczalt)' },
];

const AnnualTaxScreen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: annualReturns,
    isLoading,
    isFetching,
    refetch,
  } = useGetAnnualReturnsQuery(
    { companyId: currentCompany?.id, year: selectedYear },
    { skip: !currentCompany }
  );

  const {
    data: taxSummary,
    isLoading: summaryLoading,
  } = useGetAnnualTaxSummaryQuery(
    { companyId: currentCompany?.id, returnId: selectedReturnId },
    { skip: !currentCompany || !selectedReturnId }
  );

  const [createAnnualReturn, { isLoading: isCreating }] = useCreateAnnualReturnMutation();
  const [calculateAnnualTax, { isLoading: isCalculating }] = useCalculateAnnualTaxMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getStatusBadge = (status: AnnualReturn['status']) => {
    const config: Record<string, { color: string; label: string }> = {
      DRAFT: { color: '#9E9E9E', label: 'Szkic' },
      CALCULATING: { color: '#007AFF', label: 'Obliczanie' },
      READY: { color: '#4CAF50', label: 'Gotowe' },
      SUBMITTED: { color: '#FF9800', label: 'Wyslane' },
      ACCEPTED: { color: '#4CAF50', label: 'Zaakceptowane' },
      REJECTED: { color: '#F44336', label: 'Odrzucone' },
    };
    return config[status] || { color: '#9E9E9E', label: status };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const handleCreateReturn = () => {
    Alert.alert(
      'Nowe rozliczenie roczne',
      'Wybierz formularz podatkowy:',
      [
        ...FORM_TYPES.map((form) => ({
          text: form.label,
          onPress: async () => {
            try {
              await createAnnualReturn({
                companyId: currentCompany.id,
                formType: form.value,
                year: selectedYear,
              }).unwrap();
              Alert.alert('Sukces', `Utworzono rozliczenie ${form.value} za ${selectedYear}`);
              refetch();
            } catch (error: any) {
              Alert.alert('Blad', error?.data?.message || 'Nie udalo sie utworzyc rozliczenia');
            }
          },
        })),
        { text: 'Anuluj', style: 'cancel' },
      ]
    );
  };

  const handleCalculate = async (returnItem: AnnualReturn) => {
    try {
      await calculateAnnualTax({
        companyId: currentCompany.id,
        returnId: returnItem.id,
      }).unwrap();
      setSelectedReturnId(returnItem.id);
      Alert.alert('Sukces', 'Podatek zostal obliczony');
      refetch();
    } catch (error: any) {
      Alert.alert('Blad', error?.data?.message || 'Nie udalo sie obliczyc podatku');
    }
  };

  const handleCompare = () => {
    Alert.alert(
      'Porownaj formy opodatkowania',
      'Ta funkcja porownuje obciazenia podatkowe dla roznych form opodatkowania. Przejdz do ekranu Optymalizacji Podatkowej, aby zobaczyc szczegolowe porownanie.',
      [{ text: 'OK' }]
    );
  };

  const renderYearSelector = () => (
    <View style={styles.yearSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {YEARS.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && styles.yearButtonActive,
            ]}
            onPress={() => {
              setSelectedYear(year);
              setSelectedReturnId(null);
            }}
          >
            <Text
              style={[
                styles.yearButtonText,
                selectedYear === year && styles.yearButtonTextActive,
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSummarySection = () => {
    if (!selectedReturnId || !taxSummary) return null;

    const summary: TaxSummary = taxSummary;
    const isRefund = summary.toPayOrRefund < 0;

    return (
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Podsumowanie rozliczenia</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Przychod</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.revenue)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Koszty uzyskania przychodu</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.costs)}</Text>
        </View>

        <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
          <Text style={styles.summaryLabelBold}>Dochod</Text>
          <Text style={styles.summaryValueBold}>{formatCurrency(summary.income)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Podatek nalezny</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.tax)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Wplacone zaliczki</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.advancesPaid)}</Text>
        </View>

        <View style={[styles.summaryRow, styles.summaryRowResult]}>
          <Text style={styles.summaryLabelBold}>
            {isRefund ? 'Nadplata (do zwrotu)' : 'Do zaplaty'}
          </Text>
          <Text
            style={[
              styles.summaryValueBold,
              { color: isRefund ? '#4CAF50' : '#F44336' },
            ]}
          >
            {formatCurrency(Math.abs(summary.toPayOrRefund))}
          </Text>
        </View>

        {summaryLoading && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.summaryLoading} />
        )}
      </View>
    );
  };

  const renderReturnItem = ({ item }: { item: AnnualReturn }) => {
    const badge = getStatusBadge(item.status);
    const isSelected = selectedReturnId === item.id;

    return (
      <TouchableOpacity
        style={[styles.returnItem, isSelected && styles.returnItemSelected]}
        onPress={() => setSelectedReturnId(item.id)}
      >
        <View style={styles.returnHeader}>
          <View style={styles.returnInfo}>
            <Text style={styles.returnFormType}>{item.formType}</Text>
            <Text style={styles.returnYear}>Rok {item.year}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.statusBadgeText}>{badge.label}</Text>
          </View>
        </View>

        {item.taxAmount > 0 && (
          <View style={styles.returnTaxRow}>
            <Icon name="account-balance" size={16} color="#666" />
            <Text style={styles.returnTaxAmount}>
              Podatek: {formatCurrency(item.taxAmount)}
            </Text>
          </View>
        )}

        <View style={styles.returnActions}>
          {(item.status === 'DRAFT' || item.status === 'READY') && (
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={() => handleCalculate(item)}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="calculate" size={16} color="#FFF" />
                  <Text style={styles.calculateButtonText}>Oblicz podatek</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.compareButton} onPress={handleCompare}>
            <Icon name="compare-arrows" size={16} color="#007AFF" />
            <Text style={styles.compareButtonText}>Porownaj formy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.returnDate}>
          Utworzono: {new Date(item.createdAt).toLocaleDateString('pl-PL')}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="business" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Wybierz firme, aby zobaczyc rozliczenia roczne</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ladowanie rozliczen rocznych...</Text>
      </View>
    );
  }

  const returns: AnnualReturn[] = annualReturns?.data || annualReturns || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rozliczenie Roczne PIT</Text>
        <Text style={styles.subtitle}>Zeznania podatkowe i rozliczenia roczne</Text>
      </View>

      {/* Year Selector */}
      {renderYearSelector()}

      {/* Compare Button */}
      <TouchableOpacity style={styles.headerCompareButton} onPress={handleCompare}>
        <Icon name="compare-arrows" size={20} color="#FFF" />
        <Text style={styles.headerCompareButtonText}>Porownaj formy opodatkowania</Text>
      </TouchableOpacity>

      {/* Summary Section */}
      {renderSummarySection()}

      {/* Returns List */}
      {returns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="assignment" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Brak rozliczen rocznych za {selectedYear}</Text>
          <Text style={styles.emptySubtext}>
            Utwórz nowe rozliczenie, aby rozpoczac obliczanie podatku
          </Text>
        </View>
      ) : (
        <FlatList
          data={returns}
          renderItem={renderReturnItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isFetching}
              onRefresh={onRefresh}
            />
          }
        />
      )}

      {/* FAB - Create New Return */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateReturn}
        disabled={isCreating}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Icon name="add" size={28} color="#FFF" />
        )}
      </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },

  // Year Selector
  yearSelector: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  yearButtonActive: {
    backgroundColor: '#007AFF',
  },
  yearButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  yearButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  // Header Compare Button
  headerCompareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  headerCompareButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Summary Section
  summarySection: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryRowHighlight: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  summaryRowResult: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
    borderBottomWidth: 0,
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryLabelBold: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  summaryLoading: {
    marginTop: 12,
  },

  // Return Item
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  returnItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  returnItemSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  returnInfo: {
    flex: 1,
  },
  returnFormType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  returnYear: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  returnTaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  returnTaxAmount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  returnActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  calculateButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  compareButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  returnDate: {
    fontSize: 12,
    color: '#999',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default AnnualTaxScreen;
