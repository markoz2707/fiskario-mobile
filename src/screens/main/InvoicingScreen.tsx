import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InvoicingStackParamList } from '../../navigation/AppNavigator';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import {
  useSubmitInvoiceToKSeFMutation,
  useCheckKSeFInvoiceStatusQuery,
  useGetKSeFUPOQuery,
  useGetInvoicesQuery,
  useCalculateMobileInvoiceMutation,
  usePreviewMobileInvoiceMutation,
  useValidateMobileInvoiceMutation,
  useGetMobileInvoiceTemplatesQuery,
  usePerformIncrementalSyncMutation,
  useGetSmartDefaultsQuery,
  useCreateWorkflowMutation,
  useExecuteWorkflowStepMutation,
  useGetWorkflowsQuery,
} from '../../store/api/apiSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type InvoicingScreenNavigationProp = StackNavigationProp<InvoicingStackParamList, 'InvoiceList'>;

interface Props {
  navigation: InvoicingScreenNavigationProp;
}

interface Invoice {
  id: string;
  number: string;
  contractor: string;
  amount: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
  ksefStatus?: 'pending' | 'submitted' | 'confirmed' | 'failed';
  ksefReferenceNumber?: string;
  workflowStatus?: 'draft' | 'pending_validation' | 'validation_failed' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  workflowId?: string;
}

const InvoicingScreen: React.FC<Props> = ({ navigation }) => {
  // Redux state
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const { user } = useSelector((state: RootState) => state.auth);
  const tenantId = user?.tenantId || 'default-tenant';
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // API hooks
  const [submitToKSeF, { isLoading: isSubmittingToKSeF }] = useSubmitInvoiceToKSeFMutation();
  const [calculateInvoice, { isLoading: isCalculating }] = useCalculateMobileInvoiceMutation();
  const [previewInvoice, { isLoading: isPreviewing }] = usePreviewMobileInvoiceMutation();
  const [validateInvoice, { isLoading: isValidating }] = useValidateMobileInvoiceMutation();
  const [sync, { isLoading: isSyncing }] = usePerformIncrementalSyncMutation();
  const [createWorkflow] = useCreateWorkflowMutation();
  const [executeWorkflowStep] = useExecuteWorkflowStepMutation();

  // Smart defaults for invoice creation
  const { data: smartDefaults } = useGetSmartDefaultsQuery(
    {
      tenant_id: tenantId,
      companyId: currentCompany?.id || '',
      workflowType: 'invoice_creation',
    },
    { skip: !currentCompany?.id }
  );

  // Active workflows
  const { data: workflowsData } = useGetWorkflowsQuery(
    {
      tenantId: tenantId,
      companyId: currentCompany?.id,
      type: 'invoice_creation',
    },
    { skip: !currentCompany?.id }
  );

  // Fetch invoices from backend with pagination
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useGetInvoicesQuery(
    {
      companyId: currentCompany?.id,
      page,
      limit: 20,
    },
    { skip: !currentCompany?.id }
  );

  // Fetch invoice templates
  const {
    data: templates,
    isLoading: isLoadingTemplates,
  } = useGetMobileInvoiceTemplatesQuery(
    currentCompany?.id || '',
    { skip: !currentCompany?.id }
  );

  // Convert backend data to component format
  const invoices: Invoice[] = React.useMemo(() => {
    if (!invoicesData?.invoices) return [];

    return invoicesData.invoices.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.invoice_number,
      contractor: invoice.contractor_name,
      amount: `${invoice.gross_amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`,
      status: invoice.status,
      date: new Date(invoice.issue_date).toLocaleDateString('pl-PL'),
      ksefStatus: invoice.ksef_status,
      ksefReferenceNumber: invoice.ksef_reference_number,
      workflowStatus: invoice.workflow_status,
      workflowId: invoice.workflow_id,
    }));
  }, [invoicesData]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    try {
      await refetchInvoices();
      // Also sync with backend for offline changes
      if (currentCompany?.id) {
        await sync({
          companyId: currentCompany.id,
          deviceId: 'mobile-device-001', // In real app, get from device info
          lastSyncTimestamp: new Date().toISOString(),
        }).unwrap();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle load more
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !currentCompany?.id) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await refetchInvoices();
      if (result.data?.invoices && result.data.invoices.length < 20) {
        setHasMore(false);
      } else {
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'sent': return '#2196F3';
      case 'draft': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Opłacona';
      case 'sent': return 'Wysłana';
      case 'draft': return 'Szkic';
      case 'overdue': return 'Przeterminowana';
      default: return status;
    }
  };

  const getKSeFStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'Potwierdzona w KSeF';
      case 'submitted': return 'Wysłana do KSeF';
      case 'pending': return 'Oczekuje na KSeF';
      case 'failed': return 'Błąd KSeF';
      default: return 'Nie wysłana';
    }
  };

  const getKSeFStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'submitted': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#999';
    }
  };

  const getWorkflowStatusText = (status?: string) => {
    switch (status) {
      case 'draft': return 'Szkic';
      case 'pending_validation': return 'Oczekuje na walidację';
      case 'validation_failed': return 'Błąd walidacji';
      case 'pending_approval': return 'Oczekuje na zatwierdzenie';
      case 'approved': return 'Zatwierdzona';
      case 'processing': return 'Przetwarzanie';
      case 'completed': return 'Ukończona';
      case 'failed': return 'Niepowodzenie';
      case 'cancelled': return 'Anulowana';
      default: return 'Brak statusu';
    }
  };

  const getWorkflowStatusColor = (status?: string) => {
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

  const handleSendToKSeF = async (invoice: Invoice) => {
    if (invoice.ksefStatus === 'confirmed') {
      Alert.alert('Info', 'Faktura jest już potwierdzona w KSeF');
      return;
    }

    Alert.alert(
      'Wyślij do KSeF',
      `Czy chcesz wysłać fakturę ${invoice.number} do Krajowego Systemu e-Faktur?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyślij',
          onPress: async () => {
            try {
              const result = await submitToKSeF({
                invoiceNumber: invoice.number,
                // Add other required invoice data from backend
              }).unwrap();

              // Refresh invoices to get updated status
              refetchInvoices();
              Alert.alert('Sukces', 'Faktura została wysłana do KSeF');
            } catch (error: any) {
              const errorMessage = error?.data?.message || 'Nie udało się wysłać faktury do KSeF';
              Alert.alert('Błąd', errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleCheckKSeFStatus = (invoice: Invoice) => {
    if (!invoice.ksefReferenceNumber) {
      Alert.alert('Info', 'Faktura nie została jeszcze wysłana do KSeF');
      return;
    }

    // In real app, this would query the KSeF status
    Alert.alert('Status KSeF', `Referencja: ${invoice.ksefReferenceNumber}\nStatus: ${getKSeFStatusText(invoice.ksefStatus)}`);
  };

  const handleDownloadUPO = (invoice: Invoice) => {
    if (invoice.ksefStatus !== 'confirmed') {
      Alert.alert('Info', 'UPO dostępne tylko dla potwierdzonych faktur');
      return;
    }

    // In real app, this would download the UPO
    Alert.alert('Pobierz UPO', 'Funkcja pobierania UPO zostanie zaimplementowana');
  };

  const handleCreateInvoiceWithWorkflow = async () => {
    if (!currentCompany?.id) return;

    try {
      // Create workflow for invoice creation
      const workflow = await createWorkflow({
        tenant_id: tenantId,
        type: 'invoice_creation',
        trigger: 'manual',
        initialData: {
          companyId: currentCompany.id,
          smartDefaults: smartDefaults?.defaults,
        },
      }).unwrap();

      // Navigate to invoice creator with workflow context
      navigation.navigate('InvoiceCreator', {
        selectedCustomer: null, // No pre-selected customer
        workflowId: workflow.data.id,
        smartDefaults: smartDefaults?.defaults,
      } as any);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      Alert.alert('Błąd', 'Nie udało się utworzyć workflow dla faktury');
    }
  };

  const handleExecuteWorkflowStep = async (invoice: Invoice) => {
    if (!invoice.workflowId) return;

    try {
      await executeWorkflowStep({
        workflowId: invoice.workflowId,
        stepId: 'next', // Let backend determine next step
        inputData: { invoiceId: invoice.id },
      }).unwrap();

      // Refresh invoices to get updated workflow status
      refetchInvoices();
      Alert.alert('Sukces', 'Krok workflow został wykonany');
    } catch (error) {
      console.error('Failed to execute workflow step:', error);
      Alert.alert('Błąd', 'Nie udało się wykonać kroku workflow');
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceNumber}>{item.number}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          {item.ksefStatus && (
            <View style={[styles.ksefStatusBadge, { backgroundColor: getKSeFStatusColor(item.ksefStatus) }]}>
              <Text style={styles.statusText}>{getKSeFStatusText(item.ksefStatus)}</Text>
            </View>
          )}
          {item.workflowStatus && (
            <View style={[styles.workflowStatusBadge, { backgroundColor: getWorkflowStatusColor(item.workflowStatus) }]}>
              <Text style={styles.statusText}>{getWorkflowStatusText(item.workflowStatus)}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.contractor}>{item.contractor}</Text>
      <View style={styles.invoiceFooter}>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>

      {/* KSeF Action Buttons */}
      <View style={styles.ksefActions}>
        <TouchableOpacity
          style={[styles.ksefButton, isSubmittingToKSeF && styles.disabledButton]}
          onPress={() => handleSendToKSeF(item)}
          disabled={isSubmittingToKSeF}
        >
          {isSubmittingToKSeF ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Icon name="send" size={16} color="#007AFF" as any />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ksefButton}
          onPress={() => handleCheckKSeFStatus(item)}
        >
          <Icon name="info" size={16} color="#007AFF" as any />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ksefButton}
          onPress={() => handleDownloadUPO(item)}
        >
          <Icon name="download" size={16} color="#007AFF" as any />
        </TouchableOpacity>

        {item.workflowId && (
          <TouchableOpacity
            style={styles.workflowButton}
            onPress={() => handleExecuteWorkflowStep(item)}
          >
            <Icon name="play-arrow" size={16} color="#007AFF" as any />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Handle errors
  useEffect(() => {
    if (invoicesError) {
      Alert.alert(
        'Błąd ładowania',
        'Nie udało się załadować faktur. Spróbuj ponownie.',
        [
          { text: 'OK' }
        ]
      );
    }
  }, [invoicesError]);

  // Show loading state
  if (isLoadingInvoices && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie faktur...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Faktury</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleRefresh}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Icon name="sync" size={20} color="#007AFF" as any />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateInvoiceWithWorkflow}
          >
            <Icon name="add" size={24} color="#007AFF" as any />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMoreText}>Ładowanie więcej faktur...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={48} color="#ccc" as any />
            <Text style={styles.emptyText}>
              {invoicesError ? 'Błąd podczas ładowania faktur' : 'Brak faktur'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleRefresh}>
              <Text style={styles.emptyButtonText}>Odśwież</Text>
            </TouchableOpacity>
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
  list: {
    padding: 15,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contractor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  ksefStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  workflowStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  ksefActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ksefButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    padding: 8,
    marginRight: 10,
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

export default InvoicingScreen;