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
  useGetFixedAssetsQuery,
  useGetFixedAssetSummaryQuery,
  useGenerateMonthlyDepreciationMutation,
} from '../../store/api/apiSlice';

interface FixedAsset {
  id: string;
  name: string;
  inventoryNumber: string;
  kstGroup: string;
  initialValue: number;
  currentValue: number;
  status: 'ACTIVE' | 'SOLD' | 'LIQUIDATED';
  depreciationMethod: string;
}

interface FixedAssetSummary {
  totalAssets: number;
  totalInitialValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; backgroundColor: string }> = {
  ACTIVE: { label: 'Aktywny', color: '#28a745', backgroundColor: '#e6f4ea' },
  SOLD: { label: 'Sprzedany', color: '#e67e00', backgroundColor: '#fff3e0' },
  LIQUIDATED: { label: 'Zlikwidowany', color: '#dc3545', backgroundColor: '#fde8ea' },
};

const DEPRECIATION_LABELS: Record<string, string> = {
  linear: 'Liniowa',
  degressive: 'Degresywna',
  one_time: 'Jednorazowa',
};

const formatAmount = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0,00 PLN';
  return value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PLN';
};

const FixedAssetsScreen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [depreciationLoading, setDepreciationLoading] = useState(false);

  const { data: assets, isLoading, refetch, isFetching } = useGetFixedAssetsQuery(
    { companyId: currentCompany?.id },
    { skip: !currentCompany?.id },
  );

  const { data: summary } = useGetFixedAssetSummaryQuery(
    { companyId: currentCompany?.id },
    { skip: !currentCompany?.id },
  );

  const [generateMonthlyDepreciation] = useGenerateMonthlyDepreciationMutation();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAddAsset = () => {
    Alert.alert(
      'Nowy srodek trwaly',
      'Formularz dodawania srodka trwalego zostanie zaimplementowany w nastepnej fazie.',
      [{ text: 'OK' }],
    );
  };

  const handleGenerateDepreciation = () => {
    if (!currentCompany?.id) return;

    const now = new Date();
    const monthName = now.toLocaleString('pl-PL', { month: 'long' });
    const yearStr = now.getFullYear().toString();

    Alert.alert(
      'Generowanie amortyzacji',
      `Czy chcesz wygenerowac odpisy amortyzacyjne za ${monthName} ${yearStr}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Generuj',
          onPress: async () => {
            setDepreciationLoading(true);
            try {
              await generateMonthlyDepreciation({
                companyId: currentCompany.id,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
              }).unwrap();

              Alert.alert(
                'Amortyzacja wygenerowana',
                `Odpisy amortyzacyjne za ${monthName} ${yearStr} zostaly pomyslnie wygenerowane.`,
                [{ text: 'OK' }],
              );
              refetch();
            } catch (error: any) {
              Alert.alert(
                'Blad',
                error?.data?.message || 'Nie udalo sie wygenerowac amortyzacji. Sprobuj ponownie.',
                [{ text: 'OK' }],
              );
            } finally {
              setDepreciationLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderSummaryCards = () => {
    const totalAssets = summary?.totalAssets ?? 0;
    const totalInitialValue = summary?.totalInitialValue ?? 0;
    const totalCurrentValue = summary?.totalCurrentValue ?? 0;
    const totalDepreciation = summary?.totalDepreciation ?? 0;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="inventory" size={24} color="#007AFF" />
            <Text style={styles.summaryLabel}>Srodki trwale</Text>
            <Text style={styles.summaryValue}>{totalAssets}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="price-check" size={24} color="#28a745" />
            <Text style={styles.summaryLabel}>Wartosc poczatkowa</Text>
            <Text style={[styles.summaryValue, styles.initialValueText]}>
              {formatAmount(totalInitialValue)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#007AFF" />
            <Text style={styles.summaryLabel}>Wartosc biezaca</Text>
            <Text style={[styles.summaryValue, styles.currentValueText]}>
              {formatAmount(totalCurrentValue)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardHalf]}>
            <MaterialIcons name="trending-down" size={24} color="#dc3545" />
            <Text style={styles.summaryLabel}>Laczna amortyzacja</Text>
            <Text style={[styles.summaryValue, styles.depreciationText]}>
              {formatAmount(totalDepreciation)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDepreciationButton = () => (
    <TouchableOpacity
      style={[styles.depreciationButton, depreciationLoading && styles.depreciationButtonDisabled]}
      onPress={handleGenerateDepreciation}
      disabled={depreciationLoading}
      activeOpacity={0.8}
    >
      {depreciationLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <MaterialIcons name="calculate" size={20} color="#fff" />
      )}
      <Text style={styles.depreciationButtonText}>
        {depreciationLoading ? 'Generowanie...' : 'Generuj amortyzacje miesieczna'}
      </Text>
    </TouchableOpacity>
  );

  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
        <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderAsset = ({ item }: { item: FixedAsset }) => {
    const depMethodLabel = DEPRECIATION_LABELS[item.depreciationMethod] || item.depreciationMethod;

    return (
      <View style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <View style={styles.assetTitleRow}>
            <Text style={styles.assetName} numberOfLines={1}>{item.name}</Text>
            {renderStatusBadge(item.status)}
          </View>
          <View style={styles.assetMetaRow}>
            <Text style={styles.assetInventoryNumber}>Nr inw.: {item.inventoryNumber}</Text>
            <Text style={styles.assetKstGroup}>KST: {item.kstGroup}</Text>
          </View>
        </View>

        <View style={styles.assetValues}>
          <View style={styles.assetValueBlock}>
            <Text style={styles.assetValueLabel}>Wartosc poczatkowa</Text>
            <Text style={[styles.assetValueAmount, styles.initialValueText]}>
              {formatAmount(item.initialValue)}
            </Text>
          </View>
          <View style={styles.assetValueDivider} />
          <View style={styles.assetValueBlock}>
            <Text style={styles.assetValueLabel}>Wartosc biezaca</Text>
            <Text style={[styles.assetValueAmount, styles.currentValueText]}>
              {formatAmount(item.currentValue)}
            </Text>
          </View>
        </View>

        <View style={styles.assetFooter}>
          <MaterialIcons name="autorenew" size={14} color="#999" />
          <Text style={styles.assetDepMethod}>{depMethodLabel}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="domain" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Brak srodkow trwalych</Text>
      <Text style={styles.emptySubtext}>
        Dodaj pierwszy srodek trwaly, aby rozpoczac ewidencje i amortyzacje
      </Text>
    </View>
  );

  const renderListHeader = () => (
    <View>
      {renderSummaryCards()}
      {renderDepreciationButton()}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Srodki trwale</Text>
        <Text style={styles.listHeaderCount}>
          {Array.isArray(assets) ? assets.length : 0} pozycji
        </Text>
      </View>
    </View>
  );

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="business" size={48} color="#ccc" />
        <Text style={styles.noCompanyText}>Nie wybrano firmy</Text>
        <Text style={styles.noCompanySubtext}>Wybierz firme, aby wyswietlic srodki trwale</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ladowanie srodkow trwalych...</Text>
      </View>
    );
  }

  const assetList: FixedAsset[] = Array.isArray(assets) ? assets : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={assetList}
        keyExtractor={(item) => item.id}
        renderItem={renderAsset}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={['#007AFF']} />
        }
        contentContainerStyle={assetList.length === 0 ? styles.emptyListContent : styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddAsset} activeOpacity={0.8}>
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

  // Summary cards
  summaryContainer: {
    padding: 12,
    paddingTop: 16,
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
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  initialValueText: {
    color: '#28a745',
  },
  currentValueText: {
    color: '#007AFF',
  },
  depreciationText: {
    color: '#dc3545',
  },

  // Depreciation button
  depreciationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  depreciationButtonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  depreciationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  // List header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
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

  // Asset card
  assetCard: {
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
  assetHeader: {
    marginBottom: 10,
  },
  assetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetInventoryNumber: {
    fontSize: 13,
    color: '#666',
  },
  assetKstGroup: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },

  // Asset values
  assetValues: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginBottom: 8,
  },
  assetValueBlock: {
    flex: 1,
    alignItems: 'center',
  },
  assetValueDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  assetValueLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  assetValueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Asset footer
  assetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  assetDepMethod: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
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

export default FixedAssetsScreen;
