import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { eDeklaracjeService, UPOData } from '../services/eDeklaracjeService';

type RootStackParamList = {
  UPOList: { companyId: string };
  UPOView: { upoNumber: string };
};

type UPOListScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type UPOListScreenRouteProp = RouteProp<RootStackParamList, 'UPOList'>;

interface UPOListItemProps {
  upo: UPOData;
  onPress: (upo: UPOData) => void;
  onShare: (upo: UPOData) => void;
}

const UPOListItem: React.FC<UPOListItemProps> = ({ upo, onPress, onShare }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity style={styles.upoItem} onPress={() => onPress(upo)}>
      <View style={styles.upoHeader}>
        <View style={styles.upoNumberContainer}>
          <Text style={styles.upoNumber}>
            {eDeklaracjeService.formatUPONumber(upo.upoNumber)}
          </Text>
          <TouchableOpacity onPress={() => onShare(upo)}>
            <Icon name="share" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.upoStatus}>
          <Text style={[styles.upoStatusText, { color: '#10B981' }]}>
            {eDeklaracjeService.getStatusDescription('accepted')}
          </Text>
        </View>
      </View>

      <View style={styles.upoDetails}>
        <View style={styles.detailRow}>
          <Icon name="description" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {eDeklaracjeService.getFormDescription(upo.formCode)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="date-range" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Okres: {upo.period}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="access-time" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Potwierdzenie: {formatDate(upo.confirmationDate)}
          </Text>
        </View>

        {upo.amount && (
          <View style={styles.detailRow}>
            <Icon name="attach-money" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Kwota: {upo.amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const UPOListScreen: React.FC = () => {
  const navigation = useNavigation<UPOListScreenNavigationProp>();
  const route = useRoute<UPOListScreenRouteProp>();

  const { companyId } = route.params;

  const [upos, setUpos] = useState<UPOData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadUPOs = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 20;
      const newUPOs = await eDeklaracjeService.getUPOsForCompany(companyId, limit);

      if (loadMore) {
        setUpos(prev => [...prev, ...newUPOs]);
      } else {
        setUpos(newUPOs);
      }
    } catch (error) {
      console.error('Failed to load UPOs:', error);
      Alert.alert('Błąd', 'Nie udało się załadować UPO');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [companyId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUPOs();
    setRefreshing(false);
  }, [loadUPOs]);

  const loadMoreUPOs = useCallback(async () => {
    if (loadingMore || upos.length < 20) return;
    await loadUPOs(true);
  }, [loadingMore, upos.length, loadUPOs]);

  useEffect(() => {
    loadUPOs();
  }, [loadUPOs]);

  const handleUPOPress = (upo: UPOData) => {
    navigation.navigate('UPOView', { upoNumber: upo.upoNumber });
  };

  const handleShareUPO = async (upo: UPOData) => {
    try {
      const shareContent = `
UPO: ${eDeklaracjeService.formatUPONumber(upo.upoNumber)}
Formularz: ${eDeklaracjeService.getFormDescription(upo.formCode)}
Okres: ${upo.period}
Data potwierdzenia: ${new Date(upo.confirmationDate).toLocaleDateString('pl-PL')}
NIP podatnika: ${upo.taxpayerNIP}
      `.trim();

      await Share.share({
        message: shareContent,
        title: 'UPO - Potwierdzenie złożenia deklaracji'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const renderUPO = ({ item }: { item: UPOData }) => (
    <UPOListItem
      upo={item}
      onPress={handleUPOPress}
      onShare={handleShareUPO}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingFooterText}>Ładowanie...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt-long" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Brak UPO</Text>
      <Text style={styles.emptyText}>
        Nie znaleziono żadnych potwierdzeń złożenia deklaracji
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Ładowanie UPO...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>UPO</Text>
        <Text style={styles.headerSubtitle}>Potwierdzenia złożenia</Text>
      </View>

      {/* UPO List */}
      <FlatList
        data={upos}
        renderItem={renderUPO}
        keyExtractor={(item) => item.upoNumber}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreUPOs}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={upos.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  upoItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  upoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  upoNumberContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upoNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'monospace',
  },
  upoStatus: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upoStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upoDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingFooterText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UPOListScreen;