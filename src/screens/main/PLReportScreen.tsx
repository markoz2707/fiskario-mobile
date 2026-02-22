import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import {
  useGetWorkflowsQuery,
} from '../../store/api/apiSlice';

interface PLData {
  period: string;
  revenue: {
    total: number;
    sales: number;
    other: number;
  };
  costs: {
    total: number;
    materials: number;
    services: number;
    salaries: number;
    other: number;
  };
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  vat: {
    collected: number;
    paid: number;
    due: number;
  };
}

interface PLReportScreenProps {
  route: {
    params: {
      period?: string;
      year?: number;
    };
  };
}

const PLReportScreen: React.FC<PLReportScreenProps> = ({ route }) => {
  const [plData, setPlData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'revenue' | 'costs' | 'profit'>('summary');

  const { currentCompany } = useSelector((state: RootState) => state.company);
  const { token: authToken, user } = useSelector((state: RootState) => state.auth);
  const tenantId = user?.tenantId || 'default-tenant';

  const { period, year } = route.params || {};

  // Active workflows for reporting
  const { data: workflowsData } = useGetWorkflowsQuery(
    {
      tenantId: tenantId,
      companyId: currentCompany?.id,
      type: 'tax_calculation',
    },
    { skip: !currentCompany?.id }
  );

  useEffect(() => {
    loadPLReport();
  }, [currentCompany, period, year]);

  const loadPLReport = async () => {
    if (!currentCompany?.id || !authToken) {
      Alert.alert('Błąd', 'Brak wymaganych danych firmy');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Here you would make the actual API call to get P&L data
      // const response = await fetch(`/api/reports/pl`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // Simulate API response with sample data
      const sampleData: PLData = {
        period: year?.toString() || new Date().getFullYear().toString(),
        revenue: {
          total: 150000,
          sales: 140000,
          other: 10000,
        },
        costs: {
          total: 120000,
          materials: 60000,
          services: 20000,
          salaries: 30000,
          other: 10000,
        },
        grossProfit: 30000,
        operatingProfit: 30000,
        netProfit: 24000,
        vat: {
          collected: 28000,
          paid: 22000,
          due: 6000,
        },
      };

      setPlData(sampleData);
    } catch (error) {
      console.error('Error loading P&L report:', error);
      Alert.alert('Błąd', 'Nie udało się załadować raportu P&L');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const renderSummaryTab = () => {
    if (!plData) return null;

    const chartData = {
      labels: ['Przychody', 'Koszty', 'Zysk brutto', 'Zysk netto'],
      datasets: [
        {
          data: [
            plData.revenue.total,
            plData.costs.total,
            plData.grossProfit,
            plData.netProfit,
          ],
        },
      ],
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* Key Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Przychody</Text>
            <Text style={[styles.metricValue, styles.positiveValue]}>
              {formatCurrency(plData.revenue.total)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Koszty</Text>
            <Text style={[styles.metricValue, styles.negativeValue]}>
              {formatCurrency(plData.costs.total)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Zysk brutto</Text>
            <Text style={[styles.metricValue, styles.profitValue]}>
              {formatCurrency(plData.grossProfit)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Zysk netto</Text>
            <Text style={[styles.metricValue, styles.profitValue]}>
              {formatCurrency(plData.netProfit)}
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Struktura P&L</Text>
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 32}
            height={220}
            yAxisLabel="PLN "
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>

        {/* VAT Summary */}
        <View style={styles.vatContainer}>
          <Text style={styles.sectionTitle}>Podsumowanie VAT</Text>
          <View style={styles.vatRow}>
            <Text style={styles.vatLabel}>VAT naliczony (sprzedaż):</Text>
            <Text style={styles.vatValue}>{formatCurrency(plData.vat.collected)}</Text>
          </View>
          <View style={styles.vatRow}>
            <Text style={styles.vatLabel}>VAT należny (zakup):</Text>
            <Text style={styles.vatValue}>{formatCurrency(plData.vat.paid)}</Text>
          </View>
          <View style={[styles.vatRow, styles.vatTotal]}>
            <Text style={[styles.vatLabel, styles.vatTotalLabel]}>VAT do zapłaty:</Text>
            <Text style={[styles.vatValue, styles.vatTotalValue]}>
              {formatCurrency(plData.vat.due)}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderRevenueTab = () => {
    if (!plData) return null;

    const pieData = [
      {
        name: 'Sprzedaż',
        amount: plData.revenue.sales,
        color: '#007AFF',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
      {
        name: 'Inne przychody',
        amount: plData.revenue.other,
        color: '#28a745',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      },
    ];

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.revenueContainer}>
          <Text style={styles.sectionTitle}>Struktura przychodów</Text>

          <View style={styles.revenueSummary}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Przychody ze sprzedaży</Text>
              <Text style={[styles.revenueValue, styles.positiveValue]}>
                {formatCurrency(plData.revenue.sales)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Pozostałe przychody</Text>
              <Text style={[styles.revenueValue, styles.positiveValue]}>
                {formatCurrency(plData.revenue.other)}
              </Text>
            </View>
            <View style={[styles.revenueItem, styles.revenueTotal]}>
              <Text style={[styles.revenueLabel, styles.revenueTotalLabel]}>SUMA PRZYCHODÓW</Text>
              <Text style={[styles.revenueValue, styles.revenueTotalValue]}>
                {formatCurrency(plData.revenue.total)}
              </Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Udział w przychodach</Text>
            <PieChart
              data={pieData}
              width={Dimensions.get('window').width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCostsTab = () => {
    if (!plData) return null;

    const costData = [
      { name: 'Materiały', amount: plData.costs.materials },
      { name: 'Usługi', amount: plData.costs.services },
      { name: 'Wynagrodzenia', amount: plData.costs.salaries },
      { name: 'Inne', amount: plData.costs.other },
    ];

    const chartData = {
      labels: costData.map(item => item.name),
      datasets: [
        {
          data: costData.map(item => item.amount),
        },
      ],
    };

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.costsContainer}>
          <Text style={styles.sectionTitle}>Struktura kosztów</Text>

          {costData.map((cost, index) => (
            <View key={index} style={styles.costItem}>
              <Text style={styles.costLabel}>{cost.name}</Text>
              <Text style={[styles.costValue, styles.negativeValue]}>
                {formatCurrency(cost.amount)}
              </Text>
            </View>
          ))}

          <View style={[styles.costItem, styles.costTotal]}>
            <Text style={[styles.costLabel, styles.costTotalLabel]}>SUMA KOSZTÓW</Text>
            <Text style={[styles.costValue, styles.costTotalValue]}>
              {formatCurrency(plData.costs.total)}
            </Text>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Rozkład kosztów</Text>
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 32}
              height={220}
              yAxisLabel="PLN "
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              style={styles.chart}
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderProfitTab = () => {
    if (!plData) return null;

    const profitData = [
      { label: 'Marża brutto', value: plData.grossProfit, percentage: (plData.grossProfit / plData.revenue.total) * 100 },
      { label: 'Marża operacyjna', value: plData.operatingProfit, percentage: (plData.operatingProfit / plData.revenue.total) * 100 },
      { label: 'Marża netto', value: plData.netProfit, percentage: (plData.netProfit / plData.revenue.total) * 100 },
    ];

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.profitContainer}>
          <Text style={styles.sectionTitle}>Analiza rentowności</Text>

          {profitData.map((profit, index) => (
            <View key={index} style={styles.profitItem}>
              <View style={styles.profitHeader}>
                <Text style={styles.profitLabel}>{profit.label}</Text>
                <Text style={styles.profitValue}>{formatCurrency(profit.value)}</Text>
              </View>
              <View style={styles.profitBar}>
                <View
                  style={[
                    styles.profitBarFill,
                    { width: `${Math.min(profit.percentage, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.profitPercentage}>
                {profit.percentage.toFixed(1)}% przychodów
              </Text>
            </View>
          ))}

          <View style={styles.profitSummary}>
            <Text style={styles.profitSummaryText}>
              Zyskowność: <Text style={styles.profitValue}>
                {((plData.netProfit / plData.revenue.total) * 100).toFixed(1)}%
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie raportu P&L...</Text>
      </View>
    );
  }

  if (!plData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Nie udało się załadować danych raportu</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPLReport}>
          <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Rachunek Zysków i Strat</Text>
          <Text style={styles.headerPeriod}>Okres: {plData.period}</Text>
        </View>
        {workflowsData?.data && workflowsData.data.length > 0 && (
          <View style={styles.workflowIndicator}>
            <Text style={styles.workflowIndicatorText}>
              Aktywne workflow: {workflowsData.data.filter((w: any) => w.state === 'processing').length}
            </Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'summary', label: 'Podsumowanie' },
          { key: 'revenue', label: 'Przychody' },
          { key: 'costs', label: 'Koszty' },
          { key: 'profit', label: 'Zyskowność' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'summary' && renderSummaryTab()}
      {activeTab === 'revenue' && renderRevenueTab()}
      {activeTab === 'costs' && renderCostsTab()}
      {activeTab === 'profit' && renderProfitTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workflowIndicator: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  workflowIndicatorText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerPeriod: {
    fontSize: 16,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  metricCard: {
    width: '50%',
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#28a745',
  },
  negativeValue: {
    color: '#dc3545',
  },
  profitValue: {
    color: '#007AFF',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  vatContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  vatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  vatTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 16,
  },
  vatLabel: {
    fontSize: 14,
    color: '#666',
  },
  vatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  vatTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vatTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  revenueContainer: {
    padding: 16,
  },
  revenueSummary: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  revenueTotal: {
    borderBottomWidth: 0,
    backgroundColor: '#f8f9fa',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
  },
  revenueValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  revenueTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  revenueTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  costsContainer: {
    padding: 16,
  },
  costItem: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  costTotal: {
    backgroundColor: '#f8f9fa',
    marginTop: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
  },
  costValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  costTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  costTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  profitContainer: {
    padding: 16,
  },
  profitItem: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profitLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  profitBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 8,
  },
  profitBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  profitPercentage: {
    fontSize: 12,
    color: '#666',
  },
  profitSummary: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  profitSummaryText: {
    fontSize: 16,
    color: '#333',
  },
});

export default PLReportScreen;