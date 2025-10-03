import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  screen?: string;
  onPress?: () => void;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentCompany } = useSelector((state: RootState) => state.company as any);

  const handleNavigateToCompanies = () => {
    navigation.navigate('CompanyStack' as never);
  };

  const handleNavigateToNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  const handleNavigateToReports = () => {
    navigation.navigate('Reports' as never);
  };

  const handleGeneralSettings = () => {
    Alert.alert('Ustawienia ogólne', 'Funkcjonalność w trakcie implementacji');
  };

  const handleAccountSettings = () => {
    Alert.alert('Ustawienia konta', 'Funkcjonalność w trakcie implementacji');
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'companies',
      title: 'Firmy',
      icon: 'business',
      description: 'Zarządzaj firmami i przełączaj między nimi',
      onPress: handleNavigateToCompanies,
    },
    {
      id: 'notifications',
      title: 'Powiadomienia',
      icon: 'notifications',
      description: 'Konfiguruj ustawienia powiadomień i terminów',
      onPress: handleNavigateToNotifications,
    },
    {
      id: 'reports',
      title: 'Raporty',
      icon: 'analytics',
      description: 'Dostęp do raportów i analizy danych',
      onPress: handleNavigateToReports,
    },
    {
      id: 'general',
      title: 'Ustawienia ogólne',
      icon: 'settings',
      description: 'Ogólne ustawienia aplikacji',
      onPress: handleGeneralSettings,
    },
    {
      id: 'account',
      title: 'Konto',
      icon: 'account-circle',
      description: 'Ustawienia konta i bezpieczeństwo',
      onPress: handleAccountSettings,
    },
  ];

  const renderSettingsSection = (section: SettingsSection) => (
    <TouchableOpacity
      key={section.id}
      style={styles.sectionItem}
      onPress={section.onPress}
    >
      <View style={styles.sectionIcon}>
        <Icon name={section.icon} size={24} color="#007AFF" />
      </View>

      <View style={styles.sectionContent}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionDescription}>{section.description}</Text>
      </View>

      <View style={styles.sectionArrow}>
        <Icon name="chevron-right" size={24} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Current Company Info */}
      {currentCompany && (
        <View style={styles.currentCompanySection}>
          <Text style={styles.currentCompanyLabel}>Aktualna firma:</Text>
          <Text style={styles.currentCompanyName}>{currentCompany.name}</Text>
          <Text style={styles.currentCompanyNip}>NIP: {currentCompany.nip}</Text>
        </View>
      )}

      {/* Settings Sections */}
      <View style={styles.sectionsContainer}>
        <Text style={styles.sectionsTitle}>Ustawienia</Text>
        {settingsSections.map(renderSettingsSection)}
      </View>

      {/* App Info */}
      <View style={styles.appInfoSection}>
        <Text style={styles.appVersion}>FISKARIO v1.0.0</Text>
        <Text style={styles.appCopyright}>© 2024 FISKARIO</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  currentCompanySection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentCompanyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentCompanyNip: {
    fontSize: 14,
    color: '#666',
  },
  sectionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  sectionArrow: {
    marginLeft: 12,
  },
  appInfoSection: {
    alignItems: 'center',
    padding: 32,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;