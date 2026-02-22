import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { RootState } from '../../store';
import {
  useCompareTaxFormsMutation,
  useGetTaxThresholdsQuery,
  useGetTaxRecommendationsQuery,
} from '../../store/api/apiSlice';

interface FormComparison {
  formType: string;
  formLabel: string;
  incomeTax: number;
  zusBurden: number;
  healthInsurance: number;
  totalBurden: number;
}

interface Threshold {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  limitValue: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'EXCEEDED';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedSavings: number;
  category: string;
}

const YEARS = [2026, 2025, 2024, 2023];

const TaxOptimizationScreen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [refreshing, setRefreshing] = useState(false);
  const [revenue, setRevenue] = useState('');
  const [costs, setCosts] = useState('');
  const [comparisonResults, setComparisonResults] = useState<FormComparison[] | null>(null);

  const {
    data: thresholds,
    isLoading: thresholdsLoading,
    refetch: refetchThresholds,
  } = useGetTaxThresholdsQuery(
    { companyId: currentCompany?.id, year: selectedYear },
    { skip: !currentCompany }
  );

  const {
    data: recommendations,
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations,
  } = useGetTaxRecommendationsQuery(
    { companyId: currentCompany?.id, year: selectedYear },
    { skip: !currentCompany }
  );

  const [compareTaxForms, { isLoading: isComparing }] = useCompareTaxFormsMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchThresholds(), refetchRecommendations()]);
    setRefreshing(false);
  }, [refetchThresholds, refetchRecommendations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const handleCompare = async () => {
    if (!revenue) {
      Alert.alert('Blad', 'Podaj kwote przychodu');
      return;
    }

    try {
      const result = await compareTaxForms({
        companyId: currentCompany.id,
        year: selectedYear,
        revenue: parseFloat(revenue),
        costs: costs ? parseFloat(costs) : 0,
      }).unwrap();

      const data: FormComparison[] = result?.data || result || [];
      setComparisonResults(data);
    } catch (error: any) {
      Alert.alert('Blad', error?.data?.message || 'Nie udalo sie porownac form opodatkowania');
    }
  };

  const getThresholdStatusColor = (status: Threshold['status']) => {
    switch (status) {
      case 'SAFE': return '#4CAF50';
      case 'WARNING': return '#FF9800';
      case 'EXCEEDED': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getThresholdStatusLabel = (status: Threshold['status']) => {
    switch (status) {
      case 'SAFE': return 'Bezpieczny';
      case 'WARNING': return 'Ostrzezenie';
      case 'EXCEEDED': return 'Przekroczono';
      default: return status;
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'HIGH': return '#F44336';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#007AFF';
      default: return '#9E9E9E';
    }
  };

  const getPriorityLabel = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'HIGH': return 'Wysoki';
      case 'MEDIUM': return 'Sredni';
      case 'LOW': return 'Niski';
      default: return priority;
    }
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
            onPress={() => setSelectedYear(year)}
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

  const renderSimulationInput = () => (
    <View style={styles.simulationSection}>
      <Text style={styles.sectionTitle}>Symulacja porownania form</Text>
      <Text style={styles.sectionSubtitle}>
        Wprowadz dane, aby porownac obciazenia podatkowe
      </Text>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Przychod roczny (PLN)</Text>
          <TextInput
            style={styles.input}
            placeholder="np. 250000"
            keyboardType="numeric"
            value={revenue}
            onChangeText={setRevenue}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Koszty roczne (PLN)</Text>
          <TextInput
            style={styles.input}
            placeholder="np. 50000"
            keyboardType="numeric"
            value={costs}
            onChangeText={setCosts}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.compareButton}
        onPress={handleCompare}
        disabled={isComparing}
      >
        {isComparing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Icon name="compare-arrows" size={20} color="#FFF" />
            <Text style={styles.compareButtonText}>Porownaj formy opodatkowania</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderFormComparison = () => {
    if (!comparisonResults || comparisonResults.length === 0) return null;

    const minBurden = Math.min(...comparisonResults.map((r) => r.totalBurden));

    return (
      <View style={styles.comparisonSection}>
        <Text style={styles.sectionTitle}>Porownanie form opodatkowania</Text>

        <View style={styles.comparisonCards}>
          {comparisonResults.map((form) => {
            const isCheapest = form.totalBurden === minBurden;

            return (
              <View
                key={form.formType}
                style={[
                  styles.comparisonCard,
                  isCheapest && styles.comparisonCardCheapest,
                ]}
              >
                {isCheapest && (
                  <View style={styles.cheapestBadge}>
                    <Icon name="star" size={14} color="#FFF" />
                    <Text style={styles.cheapestBadgeText}>Najtansza</Text>
                  </View>
                )}

                <Text style={styles.comparisonFormType}>{form.formLabel || form.formType}</Text>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Podatek dochodowy</Text>
                  <Text style={styles.comparisonValue}>{formatCurrency(form.incomeTax)}</Text>
                </View>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Skladki ZUS</Text>
                  <Text style={styles.comparisonValue}>{formatCurrency(form.zusBurden)}</Text>
                </View>

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>Skladka zdrowotna</Text>
                  <Text style={styles.comparisonValue}>{formatCurrency(form.healthInsurance)}</Text>
                </View>

                <View style={styles.comparisonDivider} />

                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonTotalLabel}>Razem obciazenia</Text>
                  <Text
                    style={[
                      styles.comparisonTotalValue,
                      { color: isCheapest ? '#4CAF50' : '#333' },
                    ]}
                  >
                    {formatCurrency(form.totalBurden)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderThresholds = () => {
    const thresholdData: Threshold[] = thresholds?.data || thresholds || [];

    if (thresholdsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Ladowanie progow...</Text>
        </View>
      );
    }

    if (thresholdData.length === 0) return null;

    return (
      <View style={styles.thresholdsSection}>
        <Text style={styles.sectionTitle}>Monitorowanie progow</Text>
        <Text style={styles.sectionSubtitle}>Sledz wazne limity podatkowe</Text>

        {thresholdData.map((threshold) => {
          const statusColor = getThresholdStatusColor(threshold.status);
          const progress = Math.min(threshold.percentage / 100, 1);

          return (
            <View key={threshold.id} style={styles.thresholdItem}>
              <View style={styles.thresholdHeader}>
                <View style={styles.thresholdInfo}>
                  <Text style={styles.thresholdName}>{threshold.name}</Text>
                  <Text style={styles.thresholdDescription}>{threshold.description}</Text>
                </View>
                <View style={[styles.thresholdStatusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.thresholdStatusText}>
                    {getThresholdStatusLabel(threshold.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress * 100}%`, backgroundColor: statusColor },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {formatCurrency(threshold.currentValue)} / {formatCurrency(threshold.limitValue)}
                </Text>
              </View>

              <Text style={[styles.progressPercentage, { color: statusColor }]}>
                {threshold.percentage.toFixed(1)}%
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRecommendations = () => {
    const recommendationData: Recommendation[] = recommendations?.data || recommendations || [];

    if (recommendationsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Ladowanie rekomendacji...</Text>
        </View>
      );
    }

    if (recommendationData.length === 0) return null;

    return (
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Rekomendacje optymalizacyjne</Text>

        {recommendationData.map((rec) => {
          const priorityColor = getPriorityColor(rec.priority);

          return (
            <View
              key={rec.id}
              style={[styles.recommendationCard, { borderLeftColor: priorityColor }]}
            >
              <View style={styles.recommendationHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                  <Text style={styles.priorityBadgeText}>
                    {getPriorityLabel(rec.priority)}
                  </Text>
                </View>
                {rec.estimatedSavings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Icon name="savings" size={14} color="#4CAF50" />
                    <Text style={styles.savingsText}>
                      Oszczednosc: {formatCurrency(rec.estimatedSavings)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>

              {rec.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{rec.category}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="business" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Wybierz firme, aby zobaczyc optymalizacje podatkowa</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Optymalizacja Podatkowa</Text>
        <Text style={styles.headerSubtitle}>
          Porownaj formy, monitoruj progi i korzystaj z rekomendacji
        </Text>
      </View>

      {/* Year Selector */}
      {renderYearSelector()}

      {/* Simulation Input */}
      {renderSimulationInput()}

      {/* Form Comparison Results */}
      {renderFormComparison()}

      {/* Threshold Monitoring */}
      {renderThresholds()}

      {/* Recommendations */}
      {renderRecommendations()}

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
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

  // Section common
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },

  // Simulation Input
  simulationSection: {
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  compareButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Form Comparison
  comparisonSection: {
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
  comparisonCards: {
    gap: 12,
    marginTop: 8,
  },
  comparisonCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  comparisonCardCheapest: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F8FFF8',
  },
  cheapestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  cheapestBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonFormType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 8,
  },
  comparisonTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  comparisonTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Thresholds
  thresholdsSection: {
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
  thresholdItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  thresholdInfo: {
    flex: 1,
    marginRight: 12,
  },
  thresholdName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  thresholdDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  thresholdStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  thresholdStatusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#999',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Recommendations
  recommendationsSection: {
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
  recommendationCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priorityBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  bottomPadding: {
    height: 32,
  },
});

export default TaxOptimizationScreen;
