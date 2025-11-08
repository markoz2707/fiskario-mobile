import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import CustomerService, { CustomerData } from '../../services/customerService';
import { database } from '../../database/database';
import { mobileErrorHandler } from '../../services/mobileErrorHandler';
import {
  useGetSmartDefaultsQuery,
  useCreateWorkflowMutation,
} from '../../store/api/apiSlice';

type CustomerSelectorNavigationProp = StackNavigationProp<any, 'CustomerSelector'>;

interface Props {
  navigation: CustomerSelectorNavigationProp;
}

interface Customer {
  id: string;
  name: string;
  nip: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  isActive: boolean;
  paymentTerms: number;
  onboardingStatus?: 'draft' | 'pending_validation' | 'validation_failed' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  workflowId?: string;
}

const CustomerSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const customerService = CustomerService.getInstance(database);
  const [createWorkflow] = useCreateWorkflowMutation();

  const getOnboardingStatusText = (status?: string) => {
    switch (status) {
      case 'draft': return 'Szkic';
      case 'pending_validation': return 'Oczekuje na walidację';
      case 'validation_failed': return 'Błąd walidacji';
      case 'pending_approval': return 'Oczekuje na zatwierdzenie';
      case 'approved': return 'Zatwierdzony';
      case 'processing': return 'Przetwarzanie';
      case 'completed': return 'Ukończony';
      case 'failed': return 'Niepowodzenie';
      case 'cancelled': return 'Anulowany';
      default: return 'Brak statusu';
    }
  };

  const getOnboardingStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'approved': return '#2196F3';
      case 'processing': return '#FF9800';
      case 'pending_validation':
      case 'pending_approval': return '#FF9800';
      case 'failed':
      case 'validation_failed':
      case 'cancelled': return '#F44336';
      case 'draft': return '#666';
      default: return '#999';
    }
  };

  // Smart defaults for customer onboarding
  const { data: smartDefaults } = useGetSmartDefaultsQuery(
    {
      tenant_id: 'default-tenant',
      companyId: currentCompany?.id || '',
      workflowType: 'customer_onboarding',
    },
    { skip: !currentCompany?.id }
  );

  useEffect(() => {
    loadCustomers();
  }, [currentCompany]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.nip.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async (loadMore = false) => {
    if (!currentCompany?.id) return;

    try {
      if (!loadMore) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const customerModels = await customerService.getCustomers(currentCompany.id);

      const customerData: Customer[] = customerModels.slice((loadMore ? page - 1 : 0) * 20, (loadMore ? page : 1) * 20).map(customer => ({
        id: customer.id,
        name: customer.name,
        nip: customer.nip,
        address: customer.address,
        city: customer.city,
        email: customer.email,
        phone: customer.phone,
        isActive: customer.isActive,
        paymentTerms: customer.paymentTerms,
        onboardingStatus: 'completed', // Mock data for now
        workflowId: undefined, // Mock data for now
      }));

      if (loadMore) {
        setCustomers(prev => [...prev, ...customerData]);
        if (customerData.length < 20) {
          setHasMore(false);
        }
      } else {
        setCustomers(customerData);
        setHasMore(customerData.length >= 20);
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'loadCustomers');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
      loadCustomers(true);
    }
  };

  const handleCreateCustomer = () => {
    navigation.navigate('CustomerCreator', {
      onCustomerCreated: (newCustomer: Customer) => {
        setCustomers(prev => [newCustomer, ...prev]);
      },
      smartDefaults: smartDefaults?.defaults,
    });
  };

  const handleCreateCustomerWithWorkflow = async () => {
    if (!currentCompany?.id) return;

    try {
      // Create workflow for customer onboarding
      const workflow = await createWorkflow({
        tenant_id: 'default-tenant',
        type: 'customer_onboarding',
        trigger: 'manual',
        initialData: {
          companyId: currentCompany.id,
          smartDefaults: smartDefaults?.defaults,
        },
      }).unwrap();

      // Navigate to customer creator with workflow context
      navigation.navigate('CustomerCreator', {
        onCustomerCreated: (newCustomer: Customer) => {
          setCustomers(prev => [newCustomer, ...prev]);
        },
        workflowId: workflow.data.id,
        smartDefaults: smartDefaults?.defaults,
      } as any);
    } catch (error) {
      console.error('Failed to create customer onboarding workflow:', error);
      Alert.alert('Błąd', 'Nie udało się utworzyć workflow dla kontrahenta');
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    navigation.navigate('InvoiceCreator', {
      selectedCustomer: customer
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    navigation.navigate('CustomerEditor', {
      customerId: customer.id,
      onCustomerUpdated: (updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c =>
          c.id === customer.id ? updatedCustomer : c
        ));
      }
    });
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => handleSelectCustomer(item)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerNIP}>NIP: {item.nip}</Text>
          <Text style={styles.customerAddress}>
            {item.address}, {item.city}
          </Text>
          {item.onboardingStatus && (
            <View style={[styles.onboardingStatusBadge, {
              backgroundColor: getOnboardingStatusColor(item.onboardingStatus)
            }]}>
              <Text style={styles.statusText}>{getOnboardingStatusText(item.onboardingStatus)}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCustomer(item)}
        >
          <Icon name="edit" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.customerFooter}>
        <Text style={styles.customerContact}>
          {item.email} • {item.phone}
        </Text>
        <Text style={styles.paymentTerms}>
          Termin płatności: {item.paymentTerms} dni
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie kontrahentów...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wybierz kontrahenta</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateCustomerWithWorkflow}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Icon name="add" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj po nazwie lub NIP..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMoreText}>Ładowanie więcej kontrahentów...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchTerm ? 'Nie znaleziono kontrahentów' : 'Brak kontrahentów'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchTerm ? 'Spróbuj innego wyszukiwania' : 'Dodaj pierwszego kontrahenta'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateCustomer}>
                <Text style={styles.emptyButtonText}>Dodaj kontrahenta</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    padding: 15,
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerNIP: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 5,
  },
  customerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  customerContact: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  paymentTerms: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  onboardingStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default CustomerSelectorScreen;