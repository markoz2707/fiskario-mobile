import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ksefService } from '../services/ksef.service';

interface InvoiceDetails {
    id: string;
    ksefInvoiceNumber: string;
    number: string;
    date: string;
    dueDate?: string;
    sellerName: string;
    sellerNip: string;
    sellerAddress: string;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    approvalStatus: string;
    items: InvoiceItem[];
}

interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    grossAmount: number;
}

export default function InvoiceApprovalScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { invoiceId } = route.params as { invoiceId: string };

    const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadInvoiceDetails();
    }, [invoiceId]);

    const loadInvoiceDetails = async () => {
        setLoading(true);
        try {
            const data = await ksefService.getInvoiceDetails(invoiceId);
            setInvoice(data);
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się pobrać szczegółów faktury: ' + (error as Error).message);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        Alert.alert(
            'Zatwierdzenie faktury',
            'Czy na pewno chcesz zatwierdzić tę fakturę?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Zatwierdź',
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            await ksefService.approveInvoice(invoiceId, notes);
                            Alert.alert('Sukces', 'Faktura została zatwierdzona', [
                                { text: 'OK', onPress: () => navigation.goBack() },
                            ]);
                        } catch (error) {
                            Alert.alert('Błąd', 'Nie udało się zatwierdzić faktury: ' + (error as Error).message);
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ],
        );
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            Alert.alert('Błąd', 'Podaj powód odrzucenia faktury');
            return;
        }

        setProcessing(true);
        try {
            await ksefService.rejectInvoice(invoiceId, rejectReason);
            Alert.alert('Sukces', 'Faktura została odrzucona', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się odrzucić faktury: ' + (error as Error).message);
        } finally {
            setProcessing(false);
            setShowRejectDialog(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>Ładowanie faktury...</Text>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Nie znaleziono faktury</Text>
            </View>
        );
    }

    if (showRejectDialog) {
        return (
            <View style={styles.container}>
                <View style={styles.dialogContainer}>
                    <Text style={styles.dialogTitle}>Odrzucenie faktury</Text>
                    <Text style={styles.dialogSubtitle}>Podaj powód odrzucenia:</Text>

                    <TextInput
                        style={styles.rejectInput}
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Powód odrzucenia..."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <View style={styles.dialogButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => setShowRejectDialog(false)}
                            disabled={processing}
                        >
                            <Text style={styles.cancelButtonText}>Anuluj</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.rejectButton]}
                            onPress={handleReject}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Odrzuć</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informacje podstawowe</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Numer faktury:</Text>
                        <Text style={styles.value}>{invoice.number}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>KSeF nr:</Text>
                        <Text style={styles.value}>{invoice.ksefInvoiceNumber}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Data wystawienia:</Text>
                        <Text style={styles.value}>{new Date(invoice.date).toLocaleDateString('pl-PL')}</Text>
                    </View>
                    {invoice.dueDate && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Termin płatności:</Text>
                            <Text style={styles.value}>{new Date(invoice.dueDate).toLocaleDateString('pl-PL')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sprzedawca</Text>
                    <Text style={styles.companyName}>{invoice.sellerName}</Text>
                    <Text style={styles.companyNip}>NIP: {invoice.sellerNip}</Text>
                    <Text style={styles.companyAddress}>{invoice.sellerAddress}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pozycje faktury</Text>
                    {invoice.items.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemText}>
                                    {item.quantity} × {item.unitPrice.toFixed(2)} PLN
                                </Text>
                                <Text style={styles.itemText}>VAT: {item.vatRate}%</Text>
                            </View>
                            <Text style={styles.itemAmount}>{item.grossAmount.toFixed(2)} PLN</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Podsumowanie</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Netto:</Text>
                        <Text style={styles.summaryValue}>{invoice.totalNet.toFixed(2)} {invoice.currency}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>VAT:</Text>
                        <Text style={styles.summaryValue}>{invoice.totalVat.toFixed(2)} {invoice.currency}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Brutto:</Text>
                        <Text style={styles.totalValue}>{invoice.totalGross.toFixed(2)} {invoice.currency}</Text>
                    </View>
                </View>

                {invoice.approvalStatus === 'pending' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notatki (opcjonalne)</Text>
                        <TextInput
                            style={styles.notesInput}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Dodaj notatki do zatwierdzenia..."
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                )}
            </ScrollView>

            {invoice.approvalStatus === 'pending' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => setShowRejectDialog(true)}
                        disabled={processing}
                    >
                        <Text style={styles.buttonText}>Odrzuć</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.approveButton]}
                        onPress={handleApprove}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Zatwierdź</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
    errorText: {
        fontSize: 16,
        color: '#F44336',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    label: {
        fontSize: 14,
        color: '#757575',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212121',
    },
    companyName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 4,
    },
    companyNip: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 4,
    },
    companyAddress: {
        fontSize: 14,
        color: '#757575',
    },
    itemCard: {
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        marginBottom: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemText: {
        fontSize: 14,
        color: '#757575',
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        textAlign: 'right',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#757575',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
    },
    totalRow: {
        borderTopWidth: 2,
        borderTopColor: '#1976D2',
        marginTop: 8,
        paddingTop: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    cancelButton: {
        backgroundColor: '#9E9E9E',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dialogContainer: {
        flex: 1,
        padding: 24,
        backgroundColor: '#FFFFFF',
        margin: 24,
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 8,
    },
    dialogSubtitle: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 16,
    },
    rejectInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 120,
        marginBottom: 24,
    },
    dialogButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
