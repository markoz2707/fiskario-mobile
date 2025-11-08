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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CompanyStackParamList } from '../../navigation/AppNavigator';
import {
  useUpdateCompanyMutation,
  useGetTaxFormsQuery,
  useGetCompanyTaxSettingsQuery,
  useUpdateBulkCompanyTaxSettingsMutation
} from '../../store/api/apiSlice';
import { updateCompany } from '../../store/slices/companySlice';
import { MaterialIcons } from '@expo/vector-icons';
import { RootState } from '../../store';

type CompanyEditorScreenNavigationProp = StackNavigationProp<CompanyStackParamList, 'CompanyEditor'>;
type CompanyEditorScreenRouteProp = RouteProp<CompanyStackParamList, 'CompanyEditor'>;

interface Props {
  navigation: CompanyEditorScreenNavigationProp;
  route: CompanyEditorScreenRouteProp;
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
  selectedTaxFormIds: string[];
  taxConfigurationNotes?: string;
  skipTaxConfiguration?: boolean;
}

const CompanyEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { companyId } = route.params;
  const dispatch = useDispatch();
  const currentCompany = useSelector((state: RootState) => state.company.currentCompany);

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
    selectedTaxFormIds: [],
    taxConfigurationNotes: '',
    skipTaxConfiguration: false,
  });

  const [updateCompanyMutation, { isLoading }] = useUpdateCompanyMutation();
  const [updateCompanyTaxSettings] = useUpdateBulkCompanyTaxSettingsMutation();

  // Tax configuration state
  const [isTaxSectionExpanded, setIsTaxSectionExpanded] = useState(false);
  const [isLoadingTaxForms, setIsLoadingTaxForms] = useState(false);
  const [taxFormsError, setTaxFormsError] = useState<string | null>(null);

  // Fetch tax forms
  const { data: taxForms, isLoading: isLoadingTaxFormsQuery, error: taxFormsQueryError } = useGetTaxFormsQuery({});

  // Fetch existing tax settings
  const { data: existingTaxSettings, isLoading: isLoadingTaxSettings } = useGetCompanyTaxSettingsQuery(companyId);

  // Handle tax forms loading and error states
  useEffect(() => {
    if (isLoadingTaxFormsQuery) {
      setIsLoadingTaxForms(true);
      setTaxFormsError(null);
    } else {
      setIsLoadingTaxForms(false);
      if (taxFormsQueryError) {
        setTaxFormsError('Nie udało się załadować formularzy podatkowych');
      } else {
        setTaxFormsError(null);
      }
    }
  }, [isLoadingTaxFormsQuery, taxFormsQueryError]);

  // Load existing company data and tax settings
  useEffect(() => {
    if (currentCompany && currentCompany.id === companyId) {
      setFormData({
        name: currentCompany.name || '',
        nip: currentCompany.nip || '',
        regon: currentCompany.regon || '',
        street: currentCompany.address?.street || '',
        city: currentCompany.address?.city || '',
        postalCode: currentCompany.address?.postalCode || '',
        country: currentCompany.address?.country || 'Polska',
        vatStatus: currentCompany.vatStatus || 'active',
        taxOffice: currentCompany.taxOffice || '',
        selectedTaxFormIds: [],
        taxConfigurationNotes: '',
        skipTaxConfiguration: false,
      });
    }
  }, [currentCompany, companyId]);

  // Load existing tax settings when available
  useEffect(() => {
    if (existingTaxSettings) {
      setFormData(prev => ({
        ...prev,
        selectedTaxFormIds: existingTaxSettings.selectedTaxFormIds || [],
        taxConfigurationNotes: existingTaxSettings.notes || '',
        skipTaxConfiguration: existingTaxSettings.skipTaxConfiguration || false,
      }));

      // Expand tax section if there are existing settings
      if (existingTaxSettings.selectedTaxFormIds?.length > 0 || existingTaxSettings.skipTaxConfiguration) {
        setIsTaxSectionExpanded(true);
      }
    }
  }, [existingTaxSettings]);

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

  const validateTaxConfiguration = (): boolean => {
    // Tax configuration is optional, but if the section is expanded and no forms are selected
    // and user hasn't chosen to skip, show a warning
    if (isTaxSectionExpanded && formData.selectedTaxFormIds.length === 0 && !formData.skipTaxConfiguration) {
      Alert.alert(
        'Konfiguracja podatkowa',
        'Nie wybrałeś żadnych formularzy podatkowych ani nie zaznaczyłeś opcji "Skonfiguruj później". Czy chcesz kontynuować?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Kontynuuj', style: 'default' }
        ]
      );
      return false;
    }
    return true;
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

    if (!validateTaxConfiguration()) {
      return;
    }

    try {
      const companyData = {
        id: companyId,
        name: formData.name,
        nip: formData.nip,
        regon: formData.regon,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        vatStatus: formData.vatStatus,
        taxOffice: formData.taxOffice,
        isActive: true,
      };

      console.log('Updating company data:', companyData);
      const result = await updateCompanyMutation(companyData).unwrap();
      console.log('Company update successful:', result);
      dispatch(updateCompany(result));

      // Handle tax configuration updates if tax forms are selected or if user chose to skip
      if (formData.selectedTaxFormIds.length > 0 || formData.skipTaxConfiguration) {
        try {
          const taxSettingsData = {
            companyId: companyId,
            selectedTaxFormIds: formData.selectedTaxFormIds,
            skipTaxConfiguration: formData.skipTaxConfiguration,
            notes: formData.taxConfigurationNotes,
          };

          await updateCompanyTaxSettings(taxSettingsData).unwrap();
          console.log('Tax settings updated successfully');
        } catch (taxErr: any) {
          console.log('Tax settings update error:', taxErr);
          // Don't fail the entire process if tax settings fail
          Alert.alert(
            'Uwaga',
            'Firma została zaktualizowana, ale wystąpił błąd podczas aktualizacji konfiguracji podatkowej. Możesz skonfigurować to później w ustawieniach firmy.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }

      Alert.alert('Sukces', 'Firma została zaktualizowana', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.log('Company update error:', err);
      Alert.alert('Błąd', err.data?.message || 'Wystąpił błąd podczas aktualizacji firmy');
    }
  };

  const updateField = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoadingTaxSettings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie danych firmy...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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

          {/* Tax Configuration Section */}
          <View style={styles.taxConfigurationSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsTaxSectionExpanded(!isTaxSectionExpanded)}
            >
              <Text style={styles.sectionTitle}>Konfiguracja podatkowa</Text>
              <MaterialIcons
                name={isTaxSectionExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color="#333"
              />
            </TouchableOpacity>

            {isTaxSectionExpanded && (
              <View style={styles.taxConfigurationContent}>
                {isLoadingTaxForms ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Ładowanie formularzy podatkowych...</Text>
                  </View>
                ) : taxFormsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {taxFormsError}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        setTaxFormsError(null);
                        setIsLoadingTaxForms(true);
                        // Refetch tax forms
                        window.location.reload();
                      }}
                    >
                      <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
                    </TouchableOpacity>
                  </View>
                ) : !taxForms || taxForms.length === 0 ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      Brak dostępnych formularzy podatkowych
                    </Text>
                    <View style={styles.configurationOptions}>
                      <TouchableOpacity
                        style={styles.configureLaterButton}
                        onPress={() => {
                          setFormData(prev => ({
                            ...prev,
                            skipTaxConfiguration: true,
                            selectedTaxFormIds: []
                          }));
                          setIsTaxSectionExpanded(false);
                        }}
                      >
                        <Text style={styles.configureLaterButtonText}>
                          Skonfiguruj później (opcjonalne)
                        </Text>
                      </TouchableOpacity>

                      {formData.selectedTaxFormIds.length === 0 && !formData.skipTaxConfiguration && (
                        <Text style={styles.validationHint}>
                          Wybierz przynajmniej jeden formularz podatkowy lub zaznacz "Skonfiguruj później"
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.sectionDescription}>
                      Wybierz formularze podatkowe, które będą obowiązywać dla tej firmy.
                      Możesz skonfigurować to później w ustawieniach firmy.
                    </Text>

                    <View style={styles.taxFormsList}>
                      {taxForms?.map((taxForm: any) => (
                        <TouchableOpacity
                          key={taxForm.id}
                          style={[
                            styles.taxFormOption,
                            formData.selectedTaxFormIds.includes(taxForm.id) &&
                              styles.taxFormOptionSelected,
                          ]}
                          onPress={() => {
                            const isSelected = formData.selectedTaxFormIds.includes(taxForm.id);
                            if (isSelected) {
                              setFormData(prev => ({
                                ...prev,
                                selectedTaxFormIds: prev.selectedTaxFormIds.filter(id => id !== taxForm.id)
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedTaxFormIds: [...prev.selectedTaxFormIds, taxForm.id]
                              }));
                            }
                          }}
                        >
                          <View style={styles.taxFormContent}>
                            <Text style={[
                              styles.taxFormName,
                              formData.selectedTaxFormIds.includes(taxForm.id) &&
                                styles.taxFormNameSelected,
                            ]}>
                              {taxForm.name}
                            </Text>
                            <Text style={[
                              styles.taxFormDescription,
                              formData.selectedTaxFormIds.includes(taxForm.id) &&
                                styles.taxFormDescriptionSelected,
                            ]}>
                              {taxForm.description}
                            </Text>
                          </View>
                          <MaterialIcons
                            name={formData.selectedTaxFormIds.includes(taxForm.id)
                              ? 'check-box'
                              : 'check-box-outline-blank'}
                            size={24}
                            color={formData.selectedTaxFormIds.includes(taxForm.id)
                              ? '#007AFF'
                              : '#ccc'}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.configureLaterButton}
                      onPress={() => {
                        setFormData(prev => ({
                          ...prev,
                          skipTaxConfiguration: true,
                          selectedTaxFormIds: []
                        }));
                        setIsTaxSectionExpanded(false);
                      }}
                    >
                      <Text style={styles.configureLaterButtonText}>
                        Skonfiguruj później
                      </Text>
                    </TouchableOpacity>

                    {formData.selectedTaxFormIds.length > 0 && (
                      <View style={styles.selectedCount}>
                        <Text style={styles.selectedCountText}>
                          Wybrano {formData.selectedTaxFormIds.length} formularz(e)
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Zapisz zmiany</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  // Tax Configuration Styles
  taxConfigurationSection: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  taxConfigurationContent: {
    padding: 15,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  taxFormsList: {
    marginBottom: 15,
  },
  taxFormOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  taxFormOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  taxFormContent: {
    flex: 1,
  },
  taxFormName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  taxFormNameSelected: {
    color: '#007AFF',
  },
  taxFormDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  taxFormDescriptionSelected: {
    color: '#004499',
  },
  configureLaterButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  configureLaterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  selectedCountText: {
    fontSize: 12,
    color: '#155724',
    textAlign: 'center',
    fontWeight: '500',
  },
  configurationOptions: {
    gap: 10,
  },
  validationHint: {
    fontSize: 12,
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default CompanyEditorScreen;