import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InvoicingStackParamList } from '../../navigation/AppNavigator';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import {
  useSubmitInvoiceToKSeFMutation,
  useCheckKSeFInvoiceStatusQuery,
  useGetKSeFUPOQuery,
} from '../../store/api/apiSlice';

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
}

const InvoicingScreen: React.FC<Props> = ({ navigation }) => {
  // KSeF API hooks
  const [submitToKSeF, { isLoading: isSubmittingToKSeF }] = useSubmitInvoiceToKSeFMutation();

  // Mock data - in real app this would come from API/WatermelonDB
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      number: 'FV/2024/001',
      contractor: 'ABC Sp. z o.o.',
      amount: '12 300,00 zł',
      status: 'paid',
      date: '2024-01-15',
      ksefStatus: 'confirmed',
      ksefReferenceNumber: 'REF001',
    },
    {
      id: '2',
      number: 'FV/2024/002',
      contractor: 'XYZ Spółka Jawna',
      amount: '8 750,50 zł',
      status: 'sent',
      date: '2024-01-20',
      ksefStatus: 'submitted',
      ksefReferenceNumber: 'REF002',
    },
    {
      id: '3',
      number: 'FV/2024/003',
      contractor: 'Test Company',
      amount: '5 420,00 zł',
      status: 'draft',
      date: '2024-01-25',
      ksefStatus: 'pending',
    },
  ]);

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
                // Add other required invoice data
              }).unwrap();

              // Update local invoice status
              setInvoices(prev => prev.map(inv =>
                inv.id === invoice.id
                  ? { ...inv, ksefStatus: 'submitted', ksefReferenceNumber: result.referenceNumber }
                  : inv
              ));

              Alert.alert('Sukces', 'Faktura została wysłana do KSeF');
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się wysłać faktury do KSeF');
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
            <Icon name="send" size={16} color="#007AFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ksefButton}
          onPress={() => handleCheckKSeFStatus(item)}
        >
          <Icon name="info" size={16} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ksefButton}
          onPress={() => handleDownloadUPO(item)}
        >
          <Icon name="download" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Faktury</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('InvoiceCreator')}
        >
          <Icon name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
  disabledButton: {
    opacity: 0.5,
  },
});

export default InvoicingScreen;