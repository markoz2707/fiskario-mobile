import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  useGetZusEmployeesQuery,
  useGetZusContributionsQuery,
  useGetZusDeadlinesQuery,
} from '../../store/api/apiSlice';

const ZUSScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const [refreshing, setRefreshing] = useState(false);

  // RTK Query hooks
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    error: employeesError,
    refetch: refetchEmployees,
  } = useGetZusEmployeesQuery(
    { companyId: currentCompany?.id },
    { skip: !currentCompany?.id }
  );

  const {
    data: contributionsData,
    isLoading: isLoadingContributions,
    error: contributionsError,
    refetch: refetchContributions,
  } = useGetZusContributionsQuery(
    { companyId: currentCompany?.id },
    { skip: !currentCompany?.id }
  );

  const {
    data: deadlinesData,
    isLoading: isLoadingDeadlines,
    refetch: refetchDeadlines,
  } = useGetZusDeadlinesQuery(undefined, { skip: !currentCompany?.id });

  const isLoading = isLoadingEmployees || isLoadingContributions || isLoadingDeadlines;

  // Derive summary from real data
  const totalEmployees = employeesData?.data?.length ?? employeesData?.length ?? 0;
  const totalContributions = contributionsData?.data?.totalAmount
    ?? contributionsData?.totalAmount
    ?? (Array.isArray(contributionsData?.data)
      ? contributionsData.data.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
      : 0);
  const upcomingDeadlines = deadlinesData?.data?.length ?? deadlinesData?.length ?? 0;
  const pendingSubmissions = contributionsData?.data?.pendingCount
    ?? (Array.isArray(contributionsData?.data)
      ? contributionsData.data.filter((c: any) => c.status === 'pending').length
      : 0);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchEmployees(),
        refetchContributions(),
        refetchDeadlines(),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh ZUS data');
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToEmployees = () => {
    navigation.navigate('CompanyStack', { screen: 'CompanyList' });
  };

  const navigateToRegistrations = () => {
    navigation.navigate('Declarations');
  };

  const navigateToReports = () => {
    navigation.navigate('Settings', { screen: 'Reports' });
  };

  const navigateToDeadlines = () => {
    navigation.navigate('Deadlines');
  };

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No company selected</Text>
      </View>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Loading ZUS data...</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>ZUS Management</Text>
        <Text style={styles.subtitle}>Social Insurance Administration</Text>
      </View>

      {/* Error Banner */}
      {(employeesError || contributionsError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            Could not load some ZUS data. Pull to refresh.
          </Text>
        </View>
      )}

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalEmployees}</Text>
          <Text style={styles.summaryLabel}>Employees</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {typeof totalContributions === 'number' ? `zl ${totalContributions.toFixed(2)}` : 'zl 0.00'}
          </Text>
          <Text style={styles.summaryLabel}>Monthly Contributions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{upcomingDeadlines}</Text>
          <Text style={styles.summaryLabel}>Upcoming Deadlines</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pendingSubmissions}</Text>
          <Text style={styles.summaryLabel}>Pending Submissions</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToEmployees}>
          <Text style={styles.actionButtonIcon}>👥</Text>
          <Text style={styles.actionButtonText}>Manage Employees</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={navigateToRegistrations}>
          <Text style={styles.actionButtonIcon}>📋</Text>
          <Text style={styles.actionButtonText}>Registrations</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={navigateToReports}>
          <Text style={styles.actionButtonIcon}>📊</Text>
          <Text style={styles.actionButtonText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={navigateToDeadlines}>
          <Text style={styles.actionButtonIcon}>⏰</Text>
          <Text style={styles.actionButtonText}>Deadlines</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={navigateToEmployees}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Add Employee</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={navigateToRegistrations}
        >
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>Create Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={navigateToReports}
        >
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionText}>Generate Report</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#E65100',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
  },
  summaryCard: {
    width: '50%',
    backgroundColor: '#fff',
    padding: 15,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  quickActionsContainer: {
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionButton: {
    backgroundColor: '#2E86AB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  quickActionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default ZUSScreen;
