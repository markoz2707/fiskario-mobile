import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MainTabParamList } from '../../navigation/AppNavigator';

interface ZUSSummary {
  totalEmployees: number;
  totalContributions: number;
  upcomingDeadlines: number;
  pendingSubmissions: number;
}

const ZUSScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const [zusSummary, setZusSummary] = useState<ZUSSummary>({
    totalEmployees: 0,
    totalContributions: 0,
    upcomingDeadlines: 0,
    pendingSubmissions: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadZUSSummary();
  }, [currentCompany]);

  const loadZUSSummary = async () => {
    if (!currentCompany) return;

    try {
      // TODO: Implement API call to get ZUS summary
      // const response = await zusAPI.getSummary(currentCompany.id);
      // setZusSummary(response.data);

      // Mock data for now
      setZusSummary({
        totalEmployees: 5,
        totalContributions: 12500.50,
        upcomingDeadlines: 2,
        pendingSubmissions: 1,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load ZUS summary');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadZUSSummary();
    setRefreshing(false);
  };

  const navigateToEmployees = () => {
    Alert.alert('Info', 'Employee management screen will be implemented');
  };

  const navigateToRegistrations = () => {
    Alert.alert('Info', 'Registration screen will be implemented');
  };

  const navigateToReports = () => {
    Alert.alert('Info', 'Reports screen will be implemented');
  };

  const navigateToDeadlines = () => {
    Alert.alert('Info', 'Deadlines screen will be implemented');
  };

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No company selected</Text>
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

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{zusSummary.totalEmployees}</Text>
          <Text style={styles.summaryLabel}>Employees</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>zł {zusSummary.totalContributions.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Monthly Contributions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{zusSummary.upcomingDeadlines}</Text>
          <Text style={styles.summaryLabel}>Upcoming Deadlines</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{zusSummary.pendingSubmissions}</Text>
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

        <TouchableOpacity style={styles.quickActionButton}>
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionText}>Add Employee</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionButton}>
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>Create Registration</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionButton}>
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