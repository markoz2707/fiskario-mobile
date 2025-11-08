import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { RootState } from '../../store';
import { setCurrentCompany } from '../../store/slices/companySlice';
import {
  useGetCompaniesQuery,
  useGetDashboardSummaryQuery,
  useGetRealTimeStatusQuery,
  useGetRecentActivitiesQuery,
  useGetUpcomingDeadlinesQuery,
} from '../../store/api/apiSlice';

interface KPICardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
  isLoading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, onPress, isLoading }) => (
  <TouchableOpacity
    style={[styles.kpiCard, { borderLeftColor: color }]}
    onPress={onPress}
    disabled={!onPress || isLoading}
  >
    <View style={styles.kpiHeader}>
      <Icon name={icon as any} size={24} color={color} />
      <Text style={styles.kpiTitle}>{title}</Text>
    </View>
    {isLoading ? (
      <ActivityIndicator size="small" color={color} />
    ) : (
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    )}
  </TouchableOpacity>
);

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  onPress?: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onPress }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Przed chwilą';
    if (diffHours < 24) return `${diffHours} godz. temu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dni temu`;
  };

  return (
    <TouchableOpacity style={styles.activityItem} onPress={onPress}>
      <View style={styles.activityContent}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(activity.priority) }]} />
        <View style={styles.activityText}>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          <Text style={styles.activityTimestamp}>{formatTimestamp(activity.timestamp)}</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { data: companies, isLoading: companiesLoading, refetch: refetchCompanies } = useGetCompaniesQuery({});

  // Dashboard queries with current company filter
  const { data: dashboardSummary, isLoading: summaryLoading, refetch: refetchSummary } = useGetDashboardSummaryQuery(
    { companyId: currentCompany?.id },
    { skip: !currentCompany }
  );
  const { data: realTimeStatus, refetch: refetchStatus } = useGetRealTimeStatusQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });
  const { data: recentActivities, isLoading: activitiesLoading, refetch: refetchActivities } = useGetRecentActivitiesQuery(
    { companyId: currentCompany?.id, limit: 10 },
    { skip: !currentCompany }
  );
  const { data: upcomingDeadlines, isLoading: deadlinesLoading, refetch: refetchDeadlines } = useGetUpcomingDeadlinesQuery(
    { companyId: currentCompany?.id, limit: 5 },
    { skip: !currentCompany }
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (companies && companies.length > 0 && !currentCompany) {
      dispatch(setCurrentCompany(companies[0]));
    }
  }, [companies, currentCompany, dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchCompanies(),
      refetchSummary(),
      refetchStatus(),
      refetchActivities(),
      refetchDeadlines(),
    ]);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const kpiData = [
    {
      title: 'Przychody (miesiąc)',
      value: dashboardSummary ? formatCurrency(dashboardSummary.totalRevenue) : '0 zł',
      icon: 'trending-up',
      color: '#4CAF50',
      isLoading: summaryLoading,
    },
    {
      title: 'Aktywne kontrahenci',
      value: dashboardSummary ? dashboardSummary.activeCustomers.toString() : '0',
      icon: 'people',
      color: '#2196F3',
      isLoading: summaryLoading,
    },
    {
      title: 'Deklaracje do złożenia',
      value: dashboardSummary ? dashboardSummary.pendingDeclarations.toString() : '0',
      icon: 'assignment',
      color: '#FF9800',
      isLoading: summaryLoading,
    },
    {
      title: 'Zaległe płatności',
      value: dashboardSummary ? dashboardSummary.overduePayments.toString() : '0',
      icon: 'warning',
      color: dashboardSummary?.overduePayments > 0 ? '#F44336' : '#4CAF50',
      isLoading: summaryLoading,
    },
  ];

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#4CAF50';
      case 'degraded': return '#FF9800';
      case 'maintenance': return '#2196F3';
      default: return '#666';
    }
  };

  if (companiesLoading && !companies) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie danych...</Text>
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

      {/* System Status */}
      {realTimeStatus && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon name="info" size={20} color={getSystemStatusColor(realTimeStatus.systemStatus)} />
            <Text style={styles.statusTitle}>Status systemu</Text>
          </View>
          <Text style={[styles.statusValue, { color: getSystemStatusColor(realTimeStatus.systemStatus) }]}>
            {realTimeStatus.systemStatus === 'operational' ? 'Operacyjny' :
             realTimeStatus.systemStatus === 'degraded' ? 'Obniżona wydajność' :
             realTimeStatus.systemStatus === 'maintenance' ? 'Konserwacja' : 'Nieznany'}
          </Text>
          {realTimeStatus.alerts && realTimeStatus.alerts.length > 0 && (
            <Text style={styles.alertText}>
              {realTimeStatus.alerts.length} alertów aktywnych
            </Text>
          )}
        </View>
      )}

      {/* KPI Cards */}
      <View style={styles.kpiContainer}>
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ostatnie aktywności</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Zobacz wszystkie</Text>
          </TouchableOpacity>
        </View>
        {activitiesLoading ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
        ) : recentActivities && recentActivities.length > 0 ? (
          <FlatList
            data={recentActivities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ActivityItem activity={item} />}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>Brak ostatnich aktywności</Text>
        )}
      </View>

      {/* Upcoming Deadlines */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nadchodzące terminy</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Zobacz wszystkie</Text>
          </TouchableOpacity>
        </View>
        {deadlinesLoading ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
        ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
          <FlatList
            data={upcomingDeadlines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.deadlineItem}>
                <View style={styles.deadlineContent}>
                  <View style={[styles.priorityIndicator, {
                    backgroundColor: item.priority === 'critical' ? '#F44336' :
                                   item.priority === 'high' ? '#FF9800' :
                                   item.priority === 'medium' ? '#2196F3' : '#4CAF50'
                  }]} />
                  <View style={styles.deadlineText}>
                    <Text style={styles.deadlineDescription}>{item.description}</Text>
                    <Text style={styles.deadlineDate}>
                      {item.daysRemaining === 0 ? 'Dzisiaj' :
                       item.daysRemaining === 1 ? 'Jutro' :
                       `Za ${item.daysRemaining} dni`}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>Brak nadchodzących terminów</Text>
        )}
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
  loadingText: {
    marginTop: 10,
    color: '#666',
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
  statusCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
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
  section: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loadingIndicator: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontStyle: 'italic',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deadlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineText: {
    flex: 1,
  },
  deadlineDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  deadlineDate: {
    fontSize: 12,
    color: '#666',
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