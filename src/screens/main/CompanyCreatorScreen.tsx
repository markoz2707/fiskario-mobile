import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompanyStackParamList } from '../../navigation/AppNavigator';
import { useCreateCompanyMutation } from '../../store/api/apiSlice';
import { addCompany } from '../../store/slices/companySlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

type CompanyCreatorScreenNavigationProp = StackNavigationProp<CompanyStackParamList, 'CompanyCreator'>;

interface Props {
  navigation: CompanyCreatorScreenNavigationProp;
}

interface CompanyFormData {
  name: string;
  nip: string;
  regon: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  vatStatus: 'active' | 'exempt' | 'inactive';
  taxOffice: string;
}

const CompanyCreatorScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    nip: '',
    regon: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Polska',
    vatStatus: 'active',
    taxOffice: '',
  });
  const [createCompany, { isLoading }] = useCreateCompanyMutation();
  const dispatch = useDispatch();

  const validateNIP = (nip: string): boolean => {
    const cleanNIP = nip.replace(/[-\s]/g, '');
    if (cleanNIP.length !== 10) return false;

    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNIP[i]) * weights[i];
    }

    const checksum = sum % 11;
    return checksum === parseInt(cleanNIP[9]);
  };

  const validateREGON = (regon: string): boolean => {
    const cleanREGON = regon.replace(/[-\s]/g, '');
    if (cleanREGON.length !== 9 && cleanREGON.length !== 14) return false;

    if (cleanREGON.length === 9) {
      const weights = [8, 9, 2, 3, 4, 5, 6, 7];
      let sum = 0;

      for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanREGON[i]) * weights[i];
      }

      const checksum = sum % 11;
      return checksum === parseInt(cleanREGON[8]);
    }

    return true; // Simplified validation for 14-digit REGON
  };

  const validatePostalCode = (postalCode: string): boolean => {
    const postalCodeRegex = /^\d{2}-\d{3}$/;
    return postalCodeRegex.test(postalCode);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Błąd', 'Nazwa firmy jest wymagana');
      return;
    }

    if (!validateNIP(formData.nip)) {
      Alert.alert('Błąd', 'Nieprawidłowy numer NIP');
      return;
    }

    if (formData.regon && !validateREGON(formData.regon)) {
      Alert.alert('Błąd', 'Nieprawidłowy numer REGON');
      return;
    }

    if (!validatePostalCode(formData.postalCode)) {
      Alert.alert('Błąd', 'Nieprawidłowy kod pocztowy (format: XX-XXX)');
      return;
    }

    if (!formData.taxOffice.trim()) {
      Alert.alert('Błąd', 'Urząd skarbowy jest wymagany');
      return;
    }

    try {
      const companyData = {
        ...formData,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        isActive: true,
      };

      const result = await createCompany(companyData).unwrap();
      dispatch(addCompany(result));
      Alert.alert('Sukces', 'Firma została dodana', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Błąd', err.data?.message || 'Wystąpił błąd podczas dodawania firmy');
    }
  };

  const updateField = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Dodaj firmę</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Podstawowe informacje</Text>

          <TextInput
            style={styles.input}
            placeholder="Nazwa firmy *"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="NIP *"
            value={formData.nip}
            onChangeText={(value) => updateField('nip', value)}
            keyboardType="numeric"
            maxLength={10}
          />

          <TextInput
            style={styles.input}
            placeholder="REGON"
            value={formData.regon}
            onChangeText={(value) => updateField('regon', value)}
            keyboardType="numeric"
            maxLength={14}
          />

          <Text style={styles.sectionTitle}>Adres</Text>

          <TextInput
            style={styles.input}
            placeholder="Ulica i numer"
            value={formData.street}
            onChangeText={(value) => updateField('street', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Miasto"
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Kod pocztowy (XX-XXX)"
            value={formData.postalCode}
            onChangeText={(value) => updateField('postalCode', value)}
            maxLength={6}
          />

          <Text style={styles.sectionTitle}>Informacje podatkowe</Text>

          <TextInput
            style={styles.input}
            placeholder="Urząd skarbowy *"
            value={formData.taxOffice}
            onChangeText={(value) => updateField('taxOffice', value)}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Status VAT</Text>
            <View style={styles.pickerOptions}>
              {['active', 'exempt', 'inactive'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.pickerOption,
                    formData.vatStatus === status && styles.pickerOptionSelected,
                  ]}
                  onPress={() => updateField('vatStatus', status as any)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.vatStatus === status && styles.pickerOptionTextSelected,
                  ]}>
                    {status === 'active' ? 'Aktywny' :
                     status === 'exempt' ? 'Zwolniony' : 'Nieaktywny'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Zapisz firmę</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
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
    backgroundColor: '#fff',
    borderRadius: 8,
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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CompanyCreatorScreen;