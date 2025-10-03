import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { RootState } from '../../store';
import { setCurrentCompany } from '../../store/slices/companySlice';
import { useGetCompaniesQuery } from '../../store/api/apiSlice';

interface KPICardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.kpiCard, { borderLeftColor: color }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.kpiHeader}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.kpiTitle}>{title}</Text>
    </View>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
  </TouchableOpacity>
);

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { data: companies, isLoading, refetch } = useGetCompaniesQuery({});
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (companies && companies.length > 0 && !currentCompany) {
      dispatch(setCurrentCompany(companies[0]));
    }
  }, [companies, currentCompany, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCompanySwitch = () => {
    if (companies && companies.length > 1) {
      Alert.alert(
        'Wybierz firmę',
        'Wybierz firmę, dla której chcesz wyświetlić dane:',
        companies.map((company: any) => ({
          text: company.name,
          onPress: () => dispatch(setCurrentCompany(company)),
        }))
      );
    }
  };

  // Mock KPI data - in real app this would come from API
  const kpiData = [
    {
      title: 'Przychody (miesiąc)',
      value: '45 230,50 zł',
      icon: 'trending-up',
      color: '#4CAF50',
    },
    {
      title: 'Koszty (miesiąc)',
      value: '12 450,80 zł',
      icon: 'trending-down',
      color: '#F44336',
    },
    {
      title: 'Zysk netto',
      value: '32 779,70 zł',
      icon: 'account-balance',
      color: '#2196F3',
    },
    {
      title: 'Faktury do wystawienia',
      value: '3',
      icon: 'receipt',
      color: '#FF9800',
      onPress: () => {
        // Navigate to invoicing
      },
    },
    {
      title: 'Deklaracje do złożenia',
      value: '1',
      icon: 'assignment',
      color: '#9C27B0',
      onPress: () => {
        // Navigate to declarations
      },
    },
    {
      title: 'Powiadomienia',
      value: '5',
      icon: 'notifications',
      color: '#607D8B',
      onPress: () => {
        // Navigate to notifications
      },
    },
  ];

  if (isLoading && !companies) {
    return (
      <View style={styles.centerContainer}>
        <Text>Ładowanie...</Text>
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
      {/* Company Selector */}
      <View style={styles.companyHeader}>
        <TouchableOpacity onPress={handleCompanySwitch} style={styles.companySelector}>
          <Text style={styles.companyName}>
            {currentCompany?.name || 'Wybierz firmę'}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiContainer}>
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Szybkie akcje</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="add" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Nowa faktura</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="camera-alt" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Skanuj koszt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="assessment" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Raport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="settings" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Ustawienia</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  },
  companyHeader: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  companySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  kpiCard: {
    backgroundColor: '#fff',
    width: '48%',
    margin: '1%',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    flex: 1,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  quickActions: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    marginTop: 5,
    color: '#007AFF',
    fontSize: 12,
  },
});

export default DashboardScreen;