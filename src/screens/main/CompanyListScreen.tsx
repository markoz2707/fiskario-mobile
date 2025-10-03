import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../../store';
import { setCurrentCompany, Company } from '../../store/slices/companySlice';
import { useGetCompaniesQuery } from '../../store/api/apiSlice';

const CompanyListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { data: companies, isLoading, refetch } = useGetCompaniesQuery({});
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCompanySelect = (company: Company) => {
    dispatch(setCurrentCompany(company));
    Alert.alert('Firma wybrana', `Wybrano firmę: ${company.name}`);
  };

  const handleAddCompany = () => {
    navigation.navigate('CompanyCreator' as never);
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={[
        styles.companyItem,
        currentCompany?.id === item.id && styles.companyItemSelected,
      ]}
      onPress={() => handleCompanySelect(item)}
    >
      <View style={styles.companyIcon}>
        <Icon name="business" size={24} color={currentCompany?.id === item.id ? '#007AFF' : '#666'} />
      </View>

      <View style={styles.companyContent}>
        <Text style={[styles.companyName, currentCompany?.id === item.id && styles.companyNameSelected]}>
          {item.name}
        </Text>
        <Text style={styles.companyNip}>NIP: {item.nip}</Text>
        <Text style={styles.companyAddress}>
          {item.address.street}, {item.address.city} {item.address.postalCode}
        </Text>
      </View>

      <View style={styles.companyActions}>
        {currentCompany?.id === item.id && (
          <View style={styles.selectedIndicator}>
            <Icon name="check" size={20} color="#007AFF" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !companies) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie firm...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Firmy</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCompany}>
          <Icon name="add" size={24} color="#007AFF" />
          <Text style={styles.addButtonText}>Dodaj firmę</Text>
        </TouchableOpacity>
      </View>

      {/* Companies List */}
      <FlatList
        data={companies || []}
        renderItem={renderCompanyItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Brak firm</Text>
            <Text style={styles.emptySubtext}>Dodaj swoją pierwszą firmę</Text>
            <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddCompany}>
              <Text style={styles.emptyAddButtonText}>Dodaj firmę</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={companies?.length === 0 ? styles.emptyList : undefined}
      />
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  companyItem: {
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
  companyItemSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyContent: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  companyNameSelected: {
    color: '#007AFF',
  },
  companyNip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 14,
    color: '#666',
  },
  companyActions: {
    justifyContent: 'center',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default CompanyListScreen;