
import React, { useState, useEffect } from 'react';
import {
 View,
 Text,
 TextInput,
 TouchableOpacity,
 StyleSheet,
 ScrollView,
 Alert,
 ActivityIndicator,
 FlatList,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useCreateInvoiceMutation } from '../../store/api/apiSlice';
import { InvoicingStackParamList } from '../../navigation/AppNavigator';

type InvoiceCreatorScreenNavigationProp = StackNavigationProp<InvoicingStackParamList, 'InvoiceCreator'>;
type InvoiceCreatorScreenRouteProp = RouteProp<InvoicingStackParamList, 'InvoiceCreator'>;

interface Props {
  navigation: InvoiceCreatorScreenNavigationProp;
  route: InvoiceCreatorScreenRouteProp;
}

interface RouteParams {
  selectedCustomer?: Customer;
}

interface InvoiceItem {
 id: string;
 name: string;
 description: string;
 quantity: number;
 unit: string;
 unitPrice: number;
 vatRate: number;
 netValue: number;
 vatAmount: number;
 grossValue: number;
}

interface Customer {
 id: string;
 name: string;
 nip: string;
 address: string;
 city: string;
 email: string;
 phone: string;
 paymentTerms: number;
}

const InvoiceCreatorScreen: React.FC<Props> = ({ navigation, route }) => {
 const { currentCompany } = useSelector((state: RootState) => state.company);
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
   (route.params as any)?.selectedCustomer || null
 );

 // Invoice form state
 const [invoiceNumber, setInvoiceNumber] = useState('');
 const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
 const [dueDate, setDueDate] = useState('');
 const [paymentTerms, setPaymentTerms] = useState<number>(30);
 const [notes, setNotes] = useState('');
 const [isManualInvoiceNumber, setIsManualInvoiceNumber] = useState(false);

 // Invoice items state
 const [items, setItems] = useState<InvoiceItem[]>([
   {
     id: '1',
     name: '',
     description: '',
     quantity: 1,
     unit: 'szt',
     unitPrice: 0,
     vatRate: 23,
     netValue: 0,
     vatAmount: 0,
     grossValue: 0,
   }
 ]);

 // Loading and saving state
 const [isSaving, setIsSaving] = useState(false);
 const [createInvoice] = useCreateInvoiceMutation();

 // Auto-generate invoice number
 useEffect(() => {
   if (!isManualInvoiceNumber && currentCompany?.id) {
     generateInvoiceNumber();
   }
 }, [currentCompany, isManualInvoiceNumber]);

 // Calculate due date based on payment terms
 useEffect(() => {
   if (issueDate && paymentTerms) {
     const issue = new Date(issueDate);
     issue.setDate(issue.getDate() + paymentTerms);
     setDueDate(issue.toISOString().split('T')[0]);
   }
 }, [issueDate, paymentTerms]);

 // Calculate totals when items change
 useEffect(() => {
   calculateTotals();
 }, [items]);

 const generateInvoiceNumber = () => {
   const date = new Date();
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
   setInvoiceNumber(`${year}${month}${day}/${random}`);
 };

 const calculateItemTotals = (item: InvoiceItem): InvoiceItem => {
   const netValue = item.quantity * item.unitPrice;
   const vatAmount = netValue * (item.vatRate / 100);
   const grossValue = netValue + vatAmount;

   return {
     ...item,
     netValue: Math.round(netValue * 100) / 100,
     vatAmount: Math.round(vatAmount * 100) / 100,
     grossValue: Math.round(grossValue * 100) / 100,
   };
 };

 const calculateTotals = () => {
   const updatedItems = items.map(calculateItemTotals);
   setItems(updatedItems);
 };

 const addItem = () => {
   const newItem: InvoiceItem = {
     id: Date.now().toString(),
     name: '',
     description: '',
     quantity: 1,
     unit: 'szt',
     unitPrice: 0,
     vatRate: 23,
     netValue: 0,
     vatAmount: 0,
     grossValue: 0,
   };
   setItems([...items, newItem]);
 };

 const removeItem = (id: string) => {
   if (items.length > 1) {
     setItems(items.filter(item => item.id !== id));
   }
 };

 const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
   setItems(items.map(item => {
     if (item.id === id) {
       const updatedItem = { ...item, [field]: value };
       return calculateItemTotals(updatedItem);
     }
     return item;
   }));
 };

 const getTotals = () => {
   const subtotal = items.reduce((sum, item) => sum + item.netValue, 0);
   const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
   const total = items.reduce((sum, item) => sum + item.grossValue, 0);

   return {
     subtotal: Math.round(subtotal * 100) / 100,
     totalVat: Math.round(totalVat * 100) / 100,
     total: Math.round(total * 100) / 100,
   };
 };

 const validateForm = () => {
   if (!selectedCustomer) {
     Alert.alert('Błąd', 'Wybierz kontrahenta');
     return false;
   }

   if (!invoiceNumber.trim()) {
     Alert.alert('Błąd', 'Numer faktury jest wymagany');
     return false;
   }

   if (!issueDate) {
     Alert.alert('Błąd', 'Data wystawienia jest wymagana');
     return false;
   }

   if (!dueDate) {
     Alert.alert('Błąd', 'Termin płatności jest wymagany');
     return false;
   }

   const hasEmptyItems = items.some(item =>
     !item.name.trim() || !item.description.trim() || item.quantity <= 0 || item.unitPrice <= 0
   );

   if (hasEmptyItems) {
     Alert.alert('Błąd', 'Wypełnij wszystkie pozycje faktury');
     return false;
   }

   return true;
 };

 const handleSaveDraft = async () => {
   if (!validateForm()) return;

   await saveInvoice('draft');
 };

 const handleSaveAndSend = async () => {
   if (!validateForm()) return;

   await saveInvoice('sent');
 };

 const saveInvoice = async (status: string) => {
   if (!currentCompany?.id || !selectedCustomer) return;

   setIsSaving(true);
   try {
     const totals = getTotals();

     const invoiceData = {
       invoiceNumber,
       type: 'outgoing',
       status,
       issueDate: new Date(issueDate).getTime(),
       dueDate: new Date(dueDate).getTime(),
       companyId: currentCompany.id,
       contractorName: selectedCustomer.name,
       contractorNip: selectedCustomer.nip,
       contractorAddress: `${selectedCustomer.address}, ${selectedCustomer.city}`,
       netAmount: totals.subtotal,
       vatAmount: totals.totalVat,
       grossAmount: totals.total,
       currency: 'PLN',
       paymentMethod: 'transfer',
       notes,
       items: items.map(item => ({
         name: item.name,
         description: item.description,
         quantity: item.quantity,
         unit: item.unit,
         unitPrice: item.unitPrice,
         vatRate: item.vatRate,
         netValue: item.netValue,
         vatAmount: item.vatAmount,
         grossValue: item.grossValue,
       })),
     };

     const result = await createInvoice(invoiceData).unwrap();

     Alert.alert(
       'Sukces',
       status === 'draft' ? 'Faktura została zapisana jako szkic' : 'Faktura została utworzona i wysłana',
       [{ text: 'OK', onPress: () => navigation.goBack() }]
     );
   } catch (error: any) {
     Alert.alert('Błąd', error.data?.message || 'Wystąpił błąd podczas zapisywania faktury');
   } finally {
     setIsSaving(false);
   }
 };

 const handleSelectCustomer = () => {
   navigation.navigate('CustomerSelector', {
     onCustomerSelected: (customer: Customer) => {
       setSelectedCustomer(customer);
       setPaymentTerms(customer.paymentTerms);
     }
   });
 };

 const handleCreateCustomer = () => {
   navigation.navigate('CustomerCreator', {
     onCustomerCreated: (newCustomer: Customer) => {
       setSelectedCustomer(newCustomer);
       setPaymentTerms(newCustomer.paymentTerms);
     }
   });
 };

 const renderItem = ({ item }: { item: InvoiceItem }) => (
   <View style={styles.itemCard}>
     <View style={styles.itemHeader}>
       <Text style={styles.itemTitle}>Pozycja {items.indexOf(item) + 1}</Text>
       {items.length > 1 && (
         <TouchableOpacity
           style={styles.removeButton}
           onPress={() => removeItem(item.id)}
         >
           <Icon name="delete" size={20} color="#ff3b30" />
         </TouchableOpacity>
       )}
     </View>

     <TextInput
       style={styles.input}
       placeholder="Nazwa towaru/usługi *"
       value={item.name}
       onChangeText={(value) => updateItem(item.id, 'name', value)}
     />

     <TextInput
       style={[styles.input, styles.textArea]}
       placeholder="Opis"
       value={item.description}
       onChangeText={(value) => updateItem(item.id, 'description', value)}
       multiline
       numberOfLines={2}
     />

     <View style={styles.row}>
       <TextInput
         style={[styles.input, styles.flex1]}
         placeholder="Ilość *"
         value={item.quantity.toString()}
         onChangeText={(value) => updateItem(item.id, 'quantity', parseFloat(value) || 0)}
         keyboardType="numeric"
       />
       <TextInput
         style={[styles.input, styles.flex1, styles.marginLeft]}
         placeholder="Jednostka"
         value={item.unit}
         onChangeText={(value) => updateItem(item.id, 'unit', value)}
       />
     </View>

     <View style={styles.row}>
       <TextInput
         style={[styles.input, styles.flex1]}
         placeholder="Cena jednostkowa *"
         value={item.unitPrice.toString()}
         onChangeText={(value) => updateItem(item.id, 'unitPrice', parseFloat(value) || 0)}
         keyboardType="numeric"
       />
       <View style={[styles.pickerContainer, styles.flex1, styles.marginLeft]}>
         <TouchableOpacity
           style={styles.pickerButton}
           onPress={() => {
             Alert.alert(
               'Stawka VAT',
               'Wybierz stawkę VAT',
               [
                 { text: 'Anuluj', style: 'cancel' },
                 { text: '23%', onPress: () => updateItem(item.id, 'vatRate', 23) },
                 { text: '8%', onPress: () => updateItem(item.id, 'vatRate', 8) },
                 { text: '0%', onPress: () => updateItem(item.id, 'vatRate', 0) },
               ]
             );
           }}
         >
           <Text style={styles.pickerText}>{item.vatRate}%</Text>
           <Icon name="arrow-drop-down" size={20} color="#666" />
         </TouchableOpacity>
       </View>
     </View>

     <View style={styles.itemTotals}>
       <Text style={styles.itemTotalsText}>
         Wartość netto: {item.netValue.toFixed(2)} zł
       </Text>
       <Text style={styles.itemTotalsText}>
         VAT: {item.vatAmount.toFixed(2)} zł
       </Text>
       <Text style={[styles.itemTotalsText, styles.grossTotal]}>
         Brutto: {item.grossValue.toFixed(2)} zł
       </Text>
     </View>
   </View>
 );

 const totals = getTotals();

 return (
   <ScrollView style={styles.container}>
     <View style={styles.content}>
       {/* Customer Selection */}
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Kontrahent</Text>
         {selectedCustomer ? (
           <View style={styles.customerCard}>
             <View style={styles.customerHeader}>
               <View style={styles.customerInfo}>
                 <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                 <Text style={styles.customerNIP}>NIP: {selectedCustomer.nip}</Text>
                 <Text style={styles.customerAddress}>
                   {selectedCustomer.address}, {selectedCustomer.city}
                 </Text>
               </View>
               <TouchableOpacity
                 style={styles.changeButton}
                 onPress={handleSelectCustomer}
               >
                 <Icon name="edit" size={20} color="#007AFF" />
               </TouchableOpacity>
             </View>
           </View>
         ) : (
           <View style={styles.customerPlaceholder}>
             <TouchableOpacity style={styles.selectCustomerButton} onPress={handleSelectCustomer}>
               <Icon name="person-add" size={24} color="#007AFF" />
               <Text style={styles.selectCustomerText}>Wybierz kontrahenta</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.createCustomerButton} onPress={handleCreateCustomer}>
               <Text style={styles.createCustomerText}>Lub dodaj nowego</Text>
             </TouchableOpacity>
           </View>
         )}
       </View>

       {/* Invoice Details */}
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Dane faktury</Text>

         <View style={styles.row}>
           <TextInput
             style={[styles.input, styles.flex1]}
             placeholder="Numer faktury *"
             value={invoiceNumber}
             onChangeText={setInvoiceNumber}
             editable={isManualInvoiceNumber}
           />
           <TouchableOpacity
             style={[styles.button, styles.marginLeft]}
             onPress={() => {
               if (isManualInvoiceNumber) {
                 generateInvoiceNumber();
               }
               setIsManualInvoiceNumber(!isManualInvoiceNumber);
             }}
           >
             <Icon name={isManualInvoiceNumber ? "edit" : "refresh"} size={20} color="#fff" />
           </TouchableOpacity>
         </View>

         <View style={styles.row}>
           <TextInput
             style={[styles.input, styles.flex1]}
             placeholder="Data wystawienia *"
             value={issueDate}
             onChangeText={setIssueDate}
           />
           <TextInput
             style={[styles.input, styles.flex1, styles.marginLeft]}
             placeholder="Termin płatności *"
             value={dueDate}
             onChangeText={setDueDate}
           />
         </View>

         <View style={styles.pickerContainer}>
           <Text style={styles.label}>Termin płatności</Text>
           <View style={styles.pickerOptions}>
             {[14, 30, 60, 90].map((days) => (
               <TouchableOpacity
                 key={days}
                 style={[
                   styles.pickerOption,
                   paymentTerms === days && styles.pickerOptionSelected,
                 ]}
                 onPress={() => setPaymentTerms(days)}
               >
                 <Text style={[
                   styles.pickerOptionText,
                   paymentTerms === days && styles.pickerOptionTextSelected,
                 ]}>
                   {days} dni
                 </Text>
               </TouchableOpacity>
             ))}
           </View>
         </View>

         <TextInput
           style={[styles.input, styles.textArea]}
           placeholder="Uwagi"
           value={notes}
           onChangeText={setNotes}
           multiline
           numberOfLines={3}
         />
       </View>

       {/* Invoice Items */}
       <View style={styles.section}>
         <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Pozycje faktury</Text>
           <TouchableOpacity style={styles.addButton} onPress={addItem}>
             <Icon name="add" size={24} color="#007AFF" />
           </TouchableOpacity>
         </View>

         <FlatList
           data={items}
           renderItem={renderItem}
           keyExtractor={(item) => item.id}
           scrollEnabled={false}
           ListEmptyComponent={
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>Dodaj pierwszą pozycję faktury</Text>
             </View>
           }
         />
       </View>

       {/* Tax Summary */}
       <View style={styles.section}>
         <Text style={styles.sectionTitle}>Podsumowanie</Text>
         <View style={styles.summaryCard}>
           <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel}>Wartość netto:</Text>
             <Text style={styles.summaryValue}>{totals.subtotal.toFixed(2)} zł</Text>
           </View>
           <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel}>VAT:</Text>
             <Text style={styles.summaryValue}>{totals.totalVat.toFixed(2)} zł</Text>
           </View>
           <View style={[styles.summaryRow, styles.totalRow]}>
             <Text style={[styles.summaryLabel, styles.totalLabel]}>Razem brutto:</Text>
             <Text style={[styles.summaryValue, styles.totalValue]}>{totals.total.toFixed(2)} zł</Text>
           </View>
         </View>
       </View>

       {/* Actions */}
       <View style={styles.actions}>
         <TouchableOpacity
           style={[styles.button, styles.cancelButton]}
           onPress={() => navigation.goBack()}
         >
           <Text style={styles.cancelButtonText}>Anuluj</Text>
         </TouchableOpacity>

         <TouchableOpacity
           style={[styles.button, styles.draftButton]}
           onPress={handleSaveDraft}
           disabled={isSaving}
         >
           {isSaving ? (
             <ActivityIndicator color="#fff" />
           ) : (
             <Text style={styles.draftButtonText}>Zapisz szkic</Text>
           )}
         </TouchableOpacity>

         <TouchableOpacity
           style={[styles.button, styles.primaryButton]}
           onPress={handleSaveAndSend}
           disabled={isSaving}
         >
           {isSaving ? (
             <ActivityIndicator color="#fff" />
           ) : (
             <Text style={styles.primaryButtonText}>Zapisz i wyślij</Text>
           )}
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
 content: {
   flex: 1,
 },
 section: {
   backgroundColor: '#fff',
   margin: 15,
   marginBottom: 10,
   borderRadius: 8,
   padding: 15,
   elevation: 2,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.1,
   shadowRadius: 4,
 },
 sectionTitle: {
   fontSize: 18,
   fontWeight: 'bold',
   color: '#333',
   marginBottom: 15,
 },
 sectionHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 15,
 },
 input: {
   backgroundColor: '#f8f9fa',
   borderWidth: 1,
   borderColor: '#ddd',
   padding: 12,
   borderRadius: 6,
   fontSize: 16,
   marginBottom: 10,
 },
 textArea: {
   height: 80,
   textAlignVertical: 'top',
 },
 row: {
   flexDirection: 'row',
 },
 flex1: {
   flex: 1,
 },
 marginLeft: {
   marginLeft: 10,
 },
 button: {
   backgroundColor: '#007AFF',
   padding: 12,
   borderRadius: 6,
   alignItems: 'center',
   justifyContent: 'center',
 },
 customerCard: {
   backgroundColor: '#f8f9fa',
   padding: 15,
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#e9ecef',
 },
 customerHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'flex-start',
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
 changeButton: {
   padding: 5,
 },
 customerPlaceholder: {
   alignItems: 'center',
   padding: 20,
 },
 selectCustomerButton: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#007AFF',
   paddingHorizontal: 20,
   paddingVertical: 12,
   borderRadius: 6,
   marginBottom: 10,
 },
 selectCustomerText: {
   color: '#fff',
   fontSize: 16,
   marginLeft: 10,
 },
 createCustomerButton: {
   padding: 5,
 },
 createCustomerText: {
   color: '#007AFF',
   fontSize: 14,
 },
 itemCard: {
   backgroundColor: '#f8f9fa',
   padding: 15,
   borderRadius: 8,
   marginBottom: 15,
   borderWidth: 1,
   borderColor: '#e9ecef',
 },
 itemHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 10,
 },
 itemTitle: {
   fontSize: 16,
   fontWeight: 'bold',
   color: '#333',
 },
 removeButton: {
   padding: 5,
 },
 itemTotals: {
   marginTop: 10,
   paddingTop: 10,
   borderTopWidth: 1,
   borderTopColor: '#ddd',
 },
 itemTotalsText: {
   fontSize: 14,
   color: '#666',
   marginBottom: 2,
 },
 grossTotal: {
   fontWeight: 'bold',
   color: '#333',
 },
 pickerContainer: {
   marginBottom: 15,
 },
 label: {
   fontSize: 16,
   marginBottom: 10,
   color: '#333',
 },
 pickerOptions: {
   flexDirection: 'row',
   backgroundColor: '#f8f9fa',
   borderRadius: 6,
   borderWidth: 1,
   borderColor: '#ddd',
 },
 pickerOption: {
   flex: 1,
   padding: 12,
   alignItems: 'center',
   borderRightWidth: 1,
   borderRightColor: '#ddd',
 },
 pickerOptionSelected: {
   backgroundColor: '#007AFF',
 },
 pickerOptionText: {
   color: '#333',
 },
 pickerOptionTextSelected: {
   color: '#fff',
 },
 pickerButton: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   backgroundColor: '#f8f9fa',
   borderWidth: 1,
   borderColor: '#ddd',
   borderRadius: 6,
   padding: 12,
 },
 pickerText: {
   fontSize: 16,
   color: '#333',
 },
 addButton: {
   padding: 8,
 },
 summaryCard: {
   backgroundColor: '#f8f9fa',
   padding: 15,
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#e9ecef',
 },
 summaryRow: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginBottom: 8,
 },
 summaryLabel: {
   fontSize: 16,
   color: '#666',
 },
 summaryValue: {
   fontSize: 16,
   color: '#333',
   fontWeight: '500',
 },
 totalRow: {
   borderTopWidth: 1,
   borderTopColor: '#ddd',
   paddingTop: 10,
   marginTop: 5,
 },
 totalLabel: {
   fontSize: 18,
   fontWeight: 'bold',
   color: '#333',
 },
 totalValue: {
   fontSize: 18,
   fontWeight: 'bold',
   color: '#007AFF',
 },
 actions: {
   flexDirection: 'row',
   padding: 15,
   paddingTop: 0,
 },
 cancelButton: {
   backgroundColor: '#6c757d',
   flex: 1,
   marginRight: 10,
 },
 cancelButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: 'bold',
 },
 draftButton: {
   backgroundColor: '#ffc107',
   flex: 1,
   marginRight: 10,
 },
 draftButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: 'bold',
 },
 primaryButton: {
   backgroundColor: '#007AFF',
   flex: 1,
 },
 primaryButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: 'bold',
 },
 emptyContainer: {
   alignItems: 'center',
   padding: 20,
 },
 emptyText: {
   fontSize: 16,
   color: '#666',
 },
});

export default InvoiceCreatorScreen;