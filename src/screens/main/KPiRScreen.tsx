import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { RootState } from '../../store';
import {
  useGetKPiREntriesQuery,
  useGetKPiRMonthlySummaryQuery,
  useGetKPiRYearlySummaryQuery,
} from '../../store/api/apiSlice';

interface KPiREntry {
  id: string;
  lp: number;
  date: string;
  documentNumber: string;
  counterpartyName: string;
  description: string;
  totalRevenue: number;
  totalExpenses: number;
}

interface KPiRSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  entryCount: number;
}

const MONTHS = [
  'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien',
];

const formatAmount = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0,00 PLN';
  return value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN';
};

const KPiRScreen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  const { data: entries, isLoading, refetch, isFetching } = useGetKPiREntriesQuery(
    { companyId: currentCompany?.id, year, month },
    { skip: !currentCompany?.id },
  );

  const { data: monthlySummary } = useGetKPiRMonthlySummaryQuery(
    { companyId: currentCompany?.id, year, month },
    { skip: !currentCompany?.id || viewMode !== 'monthly' },
  );

  const { data: yearlySummary } = useGetKPiRYearlySummaryQuery(
    { companyId: currentCompany?.id, year },
    { skip: !currentCompany?.id || viewMode !== 'yearly' },
  );

  const summary: KPiRSummary | undefined = viewMode === 'monthly' ? monthlySummary : yearlySummary;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAddEntry = () => {
    Alert.alert(
      'Nowy wpis KPiR',
      'Formularz dodawania wpisu do Ksiegi Przychodow i Rozchodow zostanie zaimplementowany w nastepnej fazie.',
      [{ text: 'OK' }],
    );
  };

  const handlePreviousMonth = () => {
    if (viewMode === 'monthly') {
      if (month === 1) {
        setMonth(12);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    } else {
      setYear(year - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'monthly') {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    } else {
      setYear(year + 1);
    }
  };

  const renderSummaryCards = () => {
    const totalRevenue = summary?.totalRevenue ?? 0;
    const totalExpenses = summary?.totalExpenses ?? 0;
    const profit = summary?.profit ?? totalRevenue - totalExpenses;
    const entryCount = summary?.entryCount ?? 0;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="trending-up" size={24} color="#28a745" />
            <Text style={styles.summaryLabel}>Przychody</Text>
            <Text style={[styles.summaryValue, styles.revenueText]}>
              {formatAmount(totalRevenue)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="trending-down" size={24} color="#dc3545" />
            <Text style={styles.summaryLabel}>Koszty</Text>
            <Text style={[styles.summaryValue, styles.expenseText]}>
              {formatAmount(totalExpenses)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="account-balance" size={24} color="#007AFF" />
            <Text style={styles.summaryLabel}>Zysk / Strata</Text>
            <Text style={[styles.summaryValue, profit >= 0 ? styles.revenueText : styles.expenseText]}>
              {formatAmount(profit)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="format-list-numbered" size={24} color="#007AFF" />
            <Text style={styles.summaryLabel}>Liczba wpisow</Text>
            <Text style={styles.summaryValue}>{entryCount}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => {
    const periodLabel = viewMode === 'monthly'
      ? `${MONTHS[month - 1]} ${year}`
      : `${year}`;

    return (
      <View style={styles.periodSelector}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.periodArrow}>
          <MaterialIcons name="chevron-left" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.periodText}>{periodLabel}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.periodArrow}>
          <MaterialIcons name="chevron-right" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderViewModeToggle = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'monthly' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('monthly')}
      >
        <Text style={[styles.viewModeText, viewMode === 'monthly' && styles.viewModeTextActive]}>
          Miesięczne
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'yearly' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('yearly')}
      >
        <Text style={[styles.viewModeText, viewMode === 'yearly' && styles.viewModeTextActive]}>
          Roczne
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEntry = ({ item }: { item: KPiREntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryLpBadge}>
          <Text style={styles.entryLpText}>{item.lp}</Text>
        </View>
        <Text style={styles.entryDate}>{item.date}</Text>
        <Text style={styles.entryDocNumber} numberOfLines={1}>{item.documentNumber}</Text>
      </View>
      <Text style={styles.entryCounterparty} numberOfLines={1}>{item.counterpartyName}</Text>
      <Text style={styles.entryDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.entryAmounts}>
        <View style={styles.entryAmountBlock}>
          <Text style={styles.entryAmountLabel}>Przychod</Text>
          <Text style={[styles.entryAmountValue, styles.revenueText]}>
            {formatAmount(item.totalRevenue)}
          </Text>
        </View>
        <View style={styles.entryAmountBlock}>
          <Text style={styles.entryAmountLabel}>Koszt</Text>
          <Text style={[styles.entryAmountValue, styles.expenseText]}>
            {formatAmount(item.totalExpenses)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="menu-book" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Brak wpisow w KPiR</Text>
      <Text style={styles.emptySubtext}>
        Dodaj pierwszy wpis do Ksiegi Przychodow i Rozchodow
      </Text>
    </View>
  );

  const renderListHeader = () => (
    <View>
      {renderPeriodSelector()}
      {renderViewModeToggle()}
      {renderSummaryCards()}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Wpisy KPiR</Text>
        <Text style={styles.listHeaderCount}>
          {Array.isArray(entries) ? entries.length : 0} wpisow
        </Text>
      </View>
    </View>
  );

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="business" size={48} color="#ccc" />
        <Text style={styles.noCompanyText}>Nie wybrano firmy</Text>
        <Text style={styles.noCompanySubtext}>Wybierz firme, aby wyswietlic KPiR</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ladowanie KPiR...</Text>
      </View>
    );
  }

  const entryList: KPiREntry[] = Array.isArray(entries) ? entries : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={entryList}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={['#007AFF']} />
        }
        contentContainerStyle={entryList.length === 0 ? styles.emptyListContent : styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddEntry} activeOpacity={0.8}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  noCompanyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  noCompanySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Period selector
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodArrow: {
    padding: 4,
  },
  periodText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 160,
    textAlign: 'center',
  },

  // View mode toggle
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  viewModeTextActive: {
    color: '#fff',
  },

  // Summary cards
  summaryContainer: {
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  revenueText: {
    color: '#28a745',
  },
  expenseText: {
    color: '#dc3545',
  },

  // List header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listHeaderCount: {
    fontSize: 13,
    color: '#999',
  },

  // Entry card
  entryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryLpBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  entryLpText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 13,
    color: '#666',
    marginRight: 10,
  },
  entryDocNumber: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  entryCounterparty: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  entryAmounts: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  entryAmountBlock: {
    flex: 1,
    alignItems: 'center',
  },
  entryAmountLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  entryAmountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Empty list
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 80,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default KPiRScreen;
