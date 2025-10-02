import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { apiSlice } from '../../store/api/apiSlice';

interface ReportItem {
  id: string;
  name: string;
  description: string;
  type: 'pl' | 'vat-register' | 'cashflow' | 'receivables-payables';
  lastGenerated?: string;
  status: 'available' | 'generating' | 'error';
}

const REPORT_TYPES = [
  {
    id: 'pl',
    name: 'Rachunek Zysków i Strat',
    description: 'Profit & Loss statement with revenue, costs, and profit analysis',
    icon: '📊',
  },
  {
    id: 'vat-register',
    name: 'Rejestr VAT',
    description: 'VAT register with sales and purchase records',
    icon: '📋',
  },
  {
    id: 'cashflow',
    name: 'Przepływy Pieniężne',
    description: 'Cash flow analysis and projections',
    icon: '💰',
  },
  {
    id: 'receivables-payables',
    name: 'Należności i Zobowiązania',
    description: 'Receivables and payables aging analysis',
    icon: '⚖️',
  },
];

const ReportsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);

  const { currentCompany } = useSelector((state: RootState) => state.company);
  const authToken = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    loadReports();
  }, [currentCompany]);

  const loadReports = async () => {
    if (!currentCompany?.id || !authToken) return;

    try {
      setRefreshing(true);
      // Initialize available reports
      const availableReports: ReportItem[] = REPORT_TYPES.map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        type: type.id as any,
        status: 'available',
      }));

      setReports(availableReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Błąd', 'Nie udało się załadować raportów');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadReports();
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && report.type === selectedFilter;
  });

  const renderReportItem = ({ item }: { item: ReportItem }) => {
    const reportType = REPORT_TYPES.find(type => type.id === item.type);

    return (
      <TouchableOpacity style={styles.reportItem}>
        <View style={styles.reportIcon}>
          <Text style={styles.reportIconText}>{reportType?.icon}</Text>
        </View>

        <View style={styles.reportContent}>
          <Text style={styles.reportName}>{item.name}</Text>
          <Text style={styles.reportDescription}>{item.description}</Text>

          {item.lastGenerated && (
            <Text style={styles.reportLastGenerated}>
              Ostatnio wygenerowany: {new Date(item.lastGenerated).toLocaleDateString('pl-PL')}
            </Text>
          )}
        </View>

        <View style={styles.reportActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.generateButton]}
            onPress={() => handleGenerateReport(item)}
          >
            <Text style={styles.actionButtonText}>Generuj</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={() => handleExportReport(item)}
          >
            <Text style={styles.actionButtonText}>Eksportuj</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleGenerateReport = async (report: ReportItem) => {
    if (!currentCompany?.id || !authToken) {
      Alert.alert('Błąd', 'Brak wymaganych danych firmy');
      return;
    }

    try {
      Alert.alert(
        'Generowanie raportu',
        `Czy chcesz wygenerować raport "${report.name}"?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Generuj', onPress: () => executeReportGeneration(report) },
        ]
      );
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Błąd', 'Nie udało się wygenerować raportu');
    }
  };

  const executeReportGeneration = async (report: ReportItem) => {
    try {
      // Update report status to generating
      setReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, status: 'generating' as const } : r
      ));

      // Generate report based on type
      let endpoint = '';
      switch (report.type) {
        case 'pl':
          endpoint = '/reports/pl';
          break;
        case 'vat-register':
          endpoint = '/reports/vat-register';
          break;
        case 'cashflow':
          endpoint = '/reports/cashflow';
          break;
        case 'receivables-payables':
          endpoint = '/reports/receivables-payables';
          break;
      }

      // Here you would make the actual API call
      // const response = await apiSlice.fetch(endpoint, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update report status and last generated time
      setReports(prev => prev.map(r =>
        r.id === report.id
          ? { ...r, status: 'available' as const, lastGenerated: new Date().toISOString() }
          : r
      ));

      Alert.alert('Sukces', `Raport "${report.name}" został wygenerowany pomyślnie`);
    } catch (error) {
      console.error('Error executing report generation:', error);

      // Update report status back to available
      setReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, status: 'available' as const } : r
      ));

      Alert.alert('Błąd', 'Nie udało się wygenerować raportu');
    }
  };

  const handleExportReport = (report: ReportItem) => {
    Alert.alert(
      'Eksport raportu',
      `Wybierz format eksportu dla raportu "${report.name}"`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'CSV', onPress: () => exportReport(report, 'csv') },
        { text: 'PDF', onPress: () => exportReport(report, 'pdf') },
      ]
    );
  };

  const exportReport = async (report: ReportItem, format: 'csv' | 'pdf') => {
    if (!currentCompany?.id || !authToken) return;

    try {
      // Here you would make the actual export API call
      // const response = await apiSlice.fetch(`/reports/${report.type}/export/${format}`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      Alert.alert('Sukces', `Raport został wyeksportowany w formacie ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Błąd', 'Nie udało się wyeksportować raportu');
    }
  };

  const renderFilterButton = (filterId: string, title: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filterId && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filterId)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filterId && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj raportów..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Wszystkie')}
        {renderFilterButton('pl', 'P&L')}
        {renderFilterButton('vat-register', 'VAT')}
        {renderFilterButton('cashflow', 'Cashflow')}
        {renderFilterButton('receivables-payables', 'Należności')}
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Nie znaleziono raportów pasujących do wyszukiwania' : 'Brak dostępnych raportów'}
            </Text>
          </View>
        }
        contentContainerStyle={filteredReports.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reportItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportIconText: {
    fontSize: 24,
  },
  reportContent: {
    flex: 1,
  },
  reportName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportLastGenerated: {
    fontSize: 12,
    color: '#999',
  },
  reportActions: {
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
  },
  exportButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default ReportsScreen;