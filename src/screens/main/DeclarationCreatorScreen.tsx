import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DeclarationForm {
  type: 'VAT-7' | 'JPK_V7M' | 'JPK_V7K' | 'PIT-36' | 'CIT-8';
  period: string;
  variant?: 'M' | 'K';
  autoSubmit: boolean;
}

const DeclarationCreatorScreen = ({ navigation }: any) => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { token } = useSelector((state: RootState) => state.auth as any);

  const [form, setForm] = useState<DeclarationForm>({
    type: 'VAT-7',
    period: '2024-10',
    autoSubmit: false,
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const declarationTypes = [
    { value: 'VAT-7', label: 'VAT-7 (miesięczna)' },
    { value: 'JPK_V7M', label: 'JPK_V7M (miesięczna)' },
    { value: 'JPK_V7K', label: 'JPK_V7K (kwartalna)' },
    { value: 'PIT-36', label: 'PIT-36 (roczna)' },
    { value: 'CIT-8', label: 'CIT-8 (roczna)' },
  ];

  const handleCalculate = async () => {
    if (!currentCompany) {
      Alert.alert('Błąd', 'Nie wybrano firmy');
      return;
    }

    try {
      setCalculating(true);

      let endpoint = '';
      let body: any = {
        period: form.period,
        companyId: currentCompany.id,
      };

      switch (form.type) {
        case 'VAT-7':
          endpoint = 'calculate/vat-7';
          break;
        case 'JPK_V7M':
          endpoint = 'calculate/jpk-v7';
          body.variant = 'M';
          break;
        case 'JPK_V7K':
          endpoint = 'calculate/jpk-v7';
          body.variant = 'K';
          break;
        case 'PIT-36':
          endpoint = 'calculate/pit-advance';
          break;
        case 'CIT-8':
          endpoint = 'calculate/cit';
          break;
      }

      const response = await fetch(`http://localhost:3000/declarations/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCalculationResult(data.data);
          Alert.alert('Sukces', 'Obliczenia zostały wykonane pomyślnie');
        } else {
          Alert.alert('Błąd', data.message || 'Nie udało się wykonać obliczeń');
        }
      } else {
        Alert.alert('Błąd', 'Nie udało się połączyć z serwerem');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas wykonywania obliczeń');
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateXML = async () => {
    if (!calculationResult) {
      Alert.alert('Błąd', 'Najpierw wykonaj obliczenia');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:3000/declarations/generate-xml', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: form.type,
          period: form.period,
          companyId: currentCompany.id,
          variant: form.variant,
          calculationData: calculationResult,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          Alert.alert(
            'Sukces',
            'Plik XML został wygenerowany pomyślnie',
            [
              { text: 'OK' },
              {
                text: 'Pobierz XML',
                onPress: () => {
                  // Here you would typically download or display the XML
                  Alert.alert('XML Content', data.data.xmlContent.substring(0, 500) + '...');
                }
              }
            ]
          );
        } else {
          Alert.alert('Błąd', data.message || 'Nie udało się wygenerować XML');
        }
      } else {
        Alert.alert('Błąd', 'Nie udało się połączyć z serwerem');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas generowania XML');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!calculationResult) {
      Alert.alert('Błąd', 'Najpierw wykonaj obliczenia');
      return;
    }

    Alert.alert(
      'Potwierdzenie',
      'Czy na pewno chcesz utworzyć tę deklarację?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Utwórz', onPress: () => performSubmit() }
      ]
    );
  };

  const performSubmit = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);

      const response = await fetch('http://localhost:3000/declarations/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: form.type,
          period: form.period,
          variant: form.variant,
          companyId: currentCompany.id,
          autoSubmit: form.autoSubmit,
          calculationData: calculationResult,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          Alert.alert(
            'Sukces',
            form.autoSubmit
              ? 'Deklaracja została utworzona i wysłana'
              : 'Deklaracja została utworzona',
            [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]
          );
        } else {
          Alert.alert('Błąd', data.message || 'Nie udało się utworzyć deklaracji');
        }
      } else {
        Alert.alert('Błąd', 'Nie udało się połączyć z serwerem');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas tworzenia deklaracji');
    } finally {
      setLoading(false);
    }
  };

  const renderCalculationResult = () => {
    if (!calculationResult) return null;

    return (
      <View style={styles.calculationResult}>
        <Text style={styles.resultTitle}>Wyniki obliczeń</Text>

        {form.type.includes('VAT') && (
          <View style={styles.resultSection}>
            <Text style={styles.resultSectionTitle}>VAT</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Przychody netto:</Text>
              <Text style={styles.resultValue}>{calculationResult.totalRevenue?.toFixed(2)} zł</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>VAT należny:</Text>
              <Text style={styles.resultValue}>{calculationResult.vatCollectedSales?.toFixed(2)} zł</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>VAT naliczony:</Text>
              <Text style={styles.resultValue}>{calculationResult.vatPaidPurchases?.toFixed(2)} zł</Text>
            </View>
            <View style={[styles.resultRow, styles.totalRow]}>
              <Text style={[styles.resultLabel, styles.totalLabel]}>VAT do zapłaty:</Text>
              <Text style={[styles.resultValue, styles.totalValue]}>
                {calculationResult.vatDue?.toFixed(2)} zł
              </Text>
            </View>
          </View>
        )}

        {(form.type === 'PIT-36' || form.type === 'CIT-8') && (
          <View style={styles.resultSection}>
            <Text style={styles.resultSectionTitle}>
              {form.type === 'PIT-36' ? 'PIT' : 'CIT'}
            </Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Dochód/Przychód:</Text>
              <Text style={styles.resultValue}>{calculationResult.taxableIncome?.toFixed(2)} zł</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Podstawa opodatkowania:</Text>
              <Text style={styles.resultValue}>{calculationResult.taxBase?.toFixed(2)} zł</Text>
            </View>
            <View style={[styles.resultRow, styles.totalRow]}>
              <Text style={[styles.resultLabel, styles.totalLabel]}>Podatek do zapłaty:</Text>
              <Text style={[styles.resultValue, styles.totalValue]}>
                {calculationResult.taxDue?.toFixed(2)} zł
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Declaration Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Typ deklaracji</Text>
          {declarationTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeOption, form.type === type.value && styles.selectedTypeOption]}
              onPress={() => setForm({ ...form, type: type.value as any })}
            >
              <Text style={[styles.typeOptionText, form.type === type.value && styles.selectedTypeOptionText]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Okres rozliczeniowy</Text>
          <TextInput
            style={styles.input}
            value={form.period}
            onChangeText={(period) => setForm({ ...form, period })}
            placeholder="YYYY-MM lub YYYY-MM-DD"
          />
        </View>

        {/* Variant for JPK_V7 */}
        {form.type.includes('JPK_V7') && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Wariant</Text>
            <View style={styles.variantContainer}>
              <TouchableOpacity
                style={[styles.variantOption, form.variant === 'M' && styles.selectedVariantOption]}
                onPress={() => setForm({ ...form, variant: 'M' })}
              >
                <Text style={[styles.variantOptionText, form.variant === 'M' && styles.selectedVariantOptionText]}>
                  Miesięczny
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.variantOption, form.variant === 'K' && styles.selectedVariantOption]}
                onPress={() => setForm({ ...form, variant: 'K' })}
              >
                <Text style={[styles.variantOptionText, form.variant === 'K' && styles.selectedVariantOptionText]}>
                  Kwartalny
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Auto Submit */}
        <View style={styles.formGroup}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setForm({ ...form, autoSubmit: !form.autoSubmit })}
          >
            <View style={[styles.checkbox, form.autoSubmit && styles.checkedCheckbox]}>
              {form.autoSubmit && <Icon name="check" size={16} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Automatycznie wyślij deklarację</Text>
          </TouchableOpacity>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.button, calculating && styles.disabledButton]}
          onPress={handleCalculate}
          disabled={calculating || loading}
        >
          {calculating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="calculate" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Oblicz deklarację</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Calculation Results */}
        {renderCalculationResult()}

        {/* Action Buttons */}
        {calculationResult && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGenerateXML}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <>
                  <Icon name="description" size={20} color="#007AFF" />
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Generuj XML
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="send" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>
                    {form.autoSubmit ? 'Utwórz i wyślij' : 'Utwórz deklarację'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  typeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  selectedTypeOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  variantContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  variantOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  selectedVariantOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  variantOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedVariantOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  primaryButton: {
    backgroundColor: '#28A745',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
  },
  calculationResult: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultSection: {
    marginBottom: 16,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalLabel: {
    fontWeight: '600',
    color: '#333',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28A745',
  },
});

export default DeclarationCreatorScreen;