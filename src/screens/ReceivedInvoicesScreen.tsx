import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ksefService } from '../services/ksef.service';

interface ReceivedInvoice {
    id: string;
    ksefInvoiceNumber: string;
    number: string;
    date: string;
    sellerName: string;
    sellerNip: string;
    totalGross: number;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    currency: string;
}

export default function ReceivedInvoicesScreen() {
    const navigation = useNavigation<StackNavigationProp<any>>();
    const [invoices, setInvoices] = useState<ReceivedInvoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        loadInvoices();
    }, [filter]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await ksefService.getReceivedInvoices(filter);
            setInvoices(data);
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się pobrać faktur: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Trigger sync with KSeF
            await ksefService.syncInvoices();
            await loadInvoices();
        } catch (error) {
            Alert.alert('Błąd', 'Nie udało się zsynchronizować: ' + (error as Error).message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleInvoicePress = (invoice: ReceivedInvoice) => {
        navigation.navigate('InvoiceApproval', { invoiceId: invoice.id });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FFA500';
            case 'approved':
                return '#4CAF50';
            case 'rejected':
                return '#F44336';
            default:
                return '#9E9E9E';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Oczekuje';
            case 'approved':
                return 'Zatwierdzona';
            case 'rejected':
                return 'Odrzucona';
            default:
                return status;
        }
    };

    const renderInvoiceItem = ({ item }: { item: ReceivedInvoice }) => (
        <TouchableOpacity style={styles.invoiceCard} onPress={() => handleInvoicePress(item)}>
            <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceNumber}>{item.number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approvalStatus) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.approvalStatus)}</Text>
                </View>
            </View>

            <View style={styles.invoiceDetails}>
                <Text style={styles.sellerName}>{item.sellerName}</Text>
                <Text style={styles.sellerNip}>NIP: {item.sellerNip}</Text>
                <Text style={styles.date}>Data wystawienia: {new Date(item.date).toLocaleDateString('pl-PL')}</Text>
            </View>

            <View style={styles.invoiceFooter}>
                <Text style={styles.ksefNumber}>KSeF: {item.ksefInvoiceNumber}</Text>
                <Text style={styles.amount}>
                    {item.totalGross.toFixed(2)} {item.currency || 'PLN'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderFilters = () => (
        <View style={styles.filterContainer}>
            <TouchableOpacity
                style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                onPress={() => setFilter('all')}
            >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                    Wszystkie
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
                onPress={() => setFilter('pending')}
            >
                <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
                    Do zatwierdzenia
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterButton, filter === 'approved' && styles.filterButtonActive]}
                onPress={() => setFilter('approved')}
            >
                <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
                    Zatwierdzone
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.filterButton, filter === 'rejected' && styles.filterButtonActive]}
                onPress={() => setFilter('rejected')}
            >
                <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
                    Odrzucone
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1976D2" />
                <Text style={styles.loadingText}>Ładowanie faktur...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderFilters()}

            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                renderItem={renderInvoiceItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} />
                }
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Brak faktur do wyświetlenia</Text>
                        <Text style={styles.emptySubtext}>Pociągnij w dół, aby zsynchronizować</Text>
                    </View>
                }
            />
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
    filterContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#1976D2',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 12,
    },
    invoiceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
        marginBottom: 12,
    },
    invoiceNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    invoiceDetails: {
        marginBottom: 12,
    },
    sellerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 4,
    },
    sellerNip: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: '#757575',
    },
    invoiceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    ksefNumber: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#9E9E9E',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#BDBDBD',
    },
});
