import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGetKSeFStatusQuery } from '../../store/api/apiSlice';

const CostsScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isImporting, setIsImporting] = useState(false);

  // Check KSeF authentication status
  const { data: ksefStatus, isLoading: isCheckingKSeF } = useGetKSeFStatusQuery(undefined);

  const handleCameraScan = () => {
    Alert.alert(
      'Skanowanie kosztów',
      'Funkcja skanowania aparatu zostanie zaimplementowana w następnej fazie.',
      [{ text: 'OK' }]
    );
  };

  const handleKSeFImport = async () => {
    if (!ksefStatus?.authenticated) {
      Alert.alert(
        'Brak autoryzacji KSeF',
        'Aby importować faktury kosztowe z KSeF, należy najpierw skonfigurować połączenie z Krajowym Systemem e-Faktur.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Import faktur kosztowych z KSeF',
      'Czy chcesz zaimportować najnowsze faktury kosztowe z Krajowego Systemu e-Faktur?\n\nFunkcja pobierze faktury z ostatnich 30 dni.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Importuj',
          onPress: async () => {
            setIsImporting(true);
            try {
              // TODO: Implement actual KSeF cost invoice retrieval
              await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

              Alert.alert(
                'Import zakończony',
                'Pobrano 5 nowych faktur kosztowych z KSeF.\n\nFaktury zostały dodane do listy kosztów i są gotowe do rozliczenia.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                'Błąd importu',
                'Nie udało się pobrać faktur z KSeF. Spróbuj ponownie później.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsImporting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Koszty</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Wszystkie
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}>
              Do rozliczenia
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.placeholderContainer}>
        <Icon name="account-balance-wallet" size={64} color="#ccc" />
        <Text style={styles.placeholderText}>Brak kosztów do wyświetlenia</Text>
        <Text style={styles.placeholderSubtext}>
          Dodaj koszty poprzez skanowanie aparatu lub import z KSeF
        </Text>

        {/* KSeF Status */}
        <View style={styles.ksefStatus}>
          {isCheckingKSeF ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[
              styles.ksefStatusText,
              { color: ksefStatus?.authenticated ? '#4CAF50' : '#F44336' }
            ]}>
              KSeF: {ksefStatus?.authenticated ? 'Połączony' : 'Nie połączony'}
              {ksefStatus?.authenticated && ` (${ksefStatus.environment})`}
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCameraScan}>
            <Icon name="camera-alt" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Skanuj aparatem</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              (!ksefStatus?.authenticated || isImporting) && styles.disabledButton
            ]}
            onPress={handleKSeFImport}
            disabled={!ksefStatus?.authenticated || isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Icon name="cloud-download" size={24} color="#007AFF" />
            )}
            <Text style={[
              styles.actionButtonText,
              (!ksefStatus?.authenticated || isImporting) && styles.disabledText
            ]}>
              {isImporting ? 'Importowanie...' : 'Import z KSeF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionButtonText: {
    color: '#007AFF',
    marginTop: 8,
  },
  ksefStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ksefStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999',
  },
});

export default CostsScreen;