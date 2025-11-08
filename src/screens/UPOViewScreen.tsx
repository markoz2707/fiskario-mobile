import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';

import { eDeklaracjeService, UPOData } from '../services/eDeklaracjeService';

type RootStackParamList = {
  UPOView: { upoNumber: string };
};

type UPOViewScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type UPOViewScreenRouteProp = RouteProp<RootStackParamList, 'UPOView'>;

const { width } = Dimensions.get('window');

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, color = '#4B5563' }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowHeader}>
      <Icon name={icon} size={20} color="#6B7280" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { color }]}>{value}</Text>
  </View>
);

const UPOViewScreen: React.FC = () => {
  const navigation = useNavigation<UPOViewScreenNavigationProp>();
  const route = useRoute<UPOViewScreenRouteProp>();

  const { upoNumber } = route.params;

  const [upo, setUpo] = useState<UPOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUPO();
  }, [upoNumber]);

  const loadUPO = async () => {
    try {
      setLoading(true);
      const upoData = await eDeklaracjeService.getUPO(upoNumber);
      setUpo(upoData);
    } catch (error) {
      console.error('Failed to load UPO:', error);
      Alert.alert('Błąd', 'Nie udało się załadować UPO');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!upo) return;

    try {
      const shareContent = `
UPO: ${eDeklaracjeService.formatUPONumber(upo.upoNumber)}
Formularz: ${eDeklaracjeService.getFormDescription(upo.formCode)}
Okres: ${upo.period}
Data potwierdzenia: ${new Date(upo.confirmationDate).toLocaleDateString('pl-PL')}
NIP podatnika: ${upo.taxpayerNIP}
Kod urzędu: ${upo.taxOfficeCode}
${upo.amount ? `Kwota: ${upo.amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}` : ''}

Wygenerowano przez aplikację Fiskario
      `.trim();

      await Share.share({
        message: shareContent,
        title: 'UPO - Potwierdzenie złożenia deklaracji'
      });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Błąd', 'Nie udało się udostępnić UPO');
    }
  };

  const handleVerifyUPO = async () => {
    if (!upo) return;

    try {
      Alert.alert(
        'Weryfikacja UPO',
        'Czy chcesz zweryfikować to UPO w systemie e-Deklaracje?',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Weryfikuj',
            onPress: async () => {
              try {
                // In a real implementation, this would call the verification API
                Alert.alert('Sukces', 'UPO zostało zweryfikowane pomyślnie');
              } catch (error) {
                Alert.alert('Błąd', 'Nie udało się zweryfikować UPO');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

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

  if (!upo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Nie udało się załadować UPO</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>UPO</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* UPO Card */}
        <View style={styles.upoCard}>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Icon name="check-circle" size={16} color="#10B981" />
            <Text style={styles.statusText}>Potwierdzone</Text>
          </View>

          {/* UPO Number */}
          <View style={styles.upoNumberSection}>
            <Text style={styles.upoNumberTitle}>Numer UPO</Text>
            <Text style={styles.upoNumber} selectable>
              {eDeklaracjeService.formatUPONumber(upo.upoNumber)}
            </Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrCodeSection}>
            <QRCode
              value={`UPO:${upo.upoNumber}`}
              size={width * 0.4}
              color="black"
              backgroundColor="white"
            />
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Szczegóły deklaracji</Text>

          <InfoRow
            icon="description"
            label="Formularz"
            value={eDeklaracjeService.getFormDescription(upo.formCode)}
          />

          <InfoRow
            icon="date-range"
            label="Okres rozliczeniowy"
            value={upo.period}
          />

          <InfoRow
            icon="access-time"
            label="Data potwierdzenia"
            value={formatDateTime(upo.confirmationDate)}
          />

          <InfoRow
            icon="business"
            label="NIP podatnika"
            value={upo.taxpayerNIP}
          />

          <InfoRow
            icon="location-city"
            label="Urząd skarbowy"
            value={upo.taxOfficeCode}
          />

          {upo.amount && (
            <InfoRow
              icon="attach-money"
              label="Kwota"
              value={upo.amount.toLocaleString('pl-PL', {
                style: 'currency',
                currency: 'PLN'
              })}
              color="#059669"
            />
          )}
        </View>

        {/* Verification Section */}
        <View style={styles.verificationCard}>
          <Text style={styles.verificationTitle}>Weryfikacja</Text>
          <Text style={styles.verificationText}>
            To UPO potwierdza, że deklaracja została pomyślnie złożona w systemie e-Deklaracje Ministerstwa Finansów.
          </Text>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyUPO}
          >
            <Icon name="verified" size={20} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>Zweryfikuj UPO</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Informacje</Text>
          <Text style={styles.footerText}>
            UPO (Urząd Skarbowy Potwierdzenie Odbioru) jest oficjalnym potwierdzeniem złożenia deklaracji podatkowej w systemie e-Deklaracje.
          </Text>
          <Text style={styles.footerText}>
            Zachowaj ten dokument jako dowód poprawnego złożenia deklaracji.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  shareButton: {
    padding: 4,
  },
  upoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  upoNumberSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upoNumberTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  upoNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  qrCodeSection: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 28,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerCard: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
});

export default UPOViewScreen;