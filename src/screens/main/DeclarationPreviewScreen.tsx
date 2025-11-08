import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DeclarationPreviewData {
  type: string;
  period: string;
  fields: Record<string, any>;
  xmlContent?: string;
  summary: {
    totalAmount?: number;
    vatDue?: number;
    taxDue?: number;
    totalAcquisitions?: number;
    totalSupplies?: number;
    transactionCount?: number;
  };
}

interface SignatureMethod {
  type: 'profil_zaufany' | 'qes' | 'none';
  name: string;
  description: string;
  configured: boolean;
}

const DeclarationPreviewScreen = ({ navigation, route }: any) => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { token } = useSelector((state: RootState) => state.auth as any);

  const { declarationData, formData } = route.params || {};
  const [previewData, setPreviewData] = useState<DeclarationPreviewData | null>(null);
  const [signatureMethods, setSignatureMethods] = useState<SignatureMethod[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (declarationData && formData) {
      preparePreviewData();
      loadSignatureMethods();
    }
  }, [declarationData, formData]);

  const preparePreviewData = () => {
    if (!declarationData || !formData) return;

    const summary = calculateSummary(formData);

    setPreviewData({
      type: formData.type,
      period: formData.period,
      fields: formData.fields,
      summary,
    });
  };

  const loadSignatureMethods = async () => {
    if (!currentCompany) return;

    try {
      const response = await fetch(
        `http://localhost:3000/declarations/signature-methods/${currentCompany.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSignatureMethods(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading signature methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (formData: any) => {
    switch (formData.type) {
      case 'VAT-7':
      case 'JPK_V7M':
      case 'JPK_V7K':
        return {
          vatDue: formData.fields.vatDue || 0,
          totalAmount: Math.abs(formData.fields.vatDue || 0),
        };

      case 'PIT-36':
      case 'PIT-36L':
        return {
          taxDue: formData.fields.taxDue || 0,
          totalAmount: formData.fields.taxDue || 0,
        };

      case 'CIT-8':
      case 'CIT-8AB':
        return {
          taxDue: formData.fields.taxDue || 0,
          totalAmount: formData.fields.taxDue || 0,
        };

      case 'VAT-UE':
        return {
          totalAcquisitions: formData.fields.totalAcquisitions || 0,
          totalSupplies: formData.fields.totalSupplies || 0,
          vatDue: (formData.fields.totalAcquisitionsVAT || 0) - (formData.fields.totalSuppliesVAT || 0),
        };

      case 'PCC-3':
        return {
          taxDue: formData.fields.totalTaxDue || 0,
          transactionCount: formData.fields.transactionCount || 0,
        };

      default:
        return {};
    }
  };

  const handleGenerateXML = async () => {
    if (!previewData || !currentCompany) return;

    try {
      setGenerating(true);

      const response = await fetch('http://localhost:3000/declarations/generate-xml', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: previewData.type,
          period: previewData.period,
          companyId: currentCompany.id,
          calculationData: { details: { summary: previewData.summary } },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update preview data with XML content
          setPreviewData({
            ...previewData,
            xmlContent: data.data.xmlContent,
          });

          Alert.alert(
            'Sukces',
            'Plik XML został wygenerowany',
            [
              { text: 'OK' },
              {
                text: 'Pobierz XML',
                onPress: () => shareXML(data.data.xmlContent, data.data.fileName)
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
      setGenerating(false);
    }
  };

  const shareXML = async (xmlContent: string, fileName: string) => {
    try {
      await Share.share({
        message: xmlContent,
        title: fileName,
      });
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się udostępnić pliku XML');
    }
  };

  const handleSubmit = () => {
    if (!previewData) return;

    Alert.alert(
      'Potwierdzenie wysyłki',
      `Czy na pewno chcesz wysłać ${previewData.type} za okres ${previewData.period}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyślij',
          onPress: () => performSubmission()
        }
      ]
    );
  };

  const performSubmission = async () => {
    if (!previewData || !currentCompany) return;

    try {
      setGenerating(true);

      const response = await fetch('http://localhost:3000/declarations/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: previewData.type,
          period: previewData.period,
          companyId: currentCompany.id,
          signatureType: selectedSignature,
          xmlContent: previewData.xmlContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          Alert.alert(
            'Sukces',
            'Deklaracja została wysłana pomyślnie',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Declarations')
              }
            ]
          );
        } else {
          Alert.alert('Błąd', data.message || 'Nie udało się wysłać deklaracji');
        }
      } else {
        Alert.alert('Błąd', 'Nie udało się połączyć z serwerem');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas wysyłania deklaracji');
    } finally {
      setGenerating(false);
    }
  };

  const renderSummarySection = () => {
    if (!previewData || !previewData.summary) return null;

    return (
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Podsumowanie</Text>

        {previewData.type.includes('VAT') && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT do zapłaty/zwrotu:</Text>
              <Text style={[
                styles.summaryValue,
                (previewData.summary.vatDue || 0) >= 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {Math.abs(previewData.summary.vatDue || 0).toFixed(2)} zł
                {(previewData.summary.vatDue || 0) >= 0 ? ' (do zapłaty)' : ' (do zwrotu)'}
              </Text>
            </View>
          </>
        )}

        {(previewData.type === 'PIT-36' || previewData.type === 'PIT-36L' || previewData.type === 'CIT-8' || previewData.type === 'CIT-8AB') && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Podatek do zapłaty:</Text>
            <Text style={[styles.summaryValue, styles.positiveAmount]}>
              {previewData.summary.taxDue?.toFixed(2)} zł
            </Text>
          </View>
        )}

        {previewData.type === 'VAT-UE' && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nabycia wewnątrzwspólnotowe:</Text>
              <Text style={styles.summaryValue}>
                {previewData.summary.totalAcquisitions?.toFixed(2)} zł
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dostawy wewnątrzwspólnotowe:</Text>
              <Text style={styles.summaryValue}>
                {previewData.summary.totalSupplies?.toFixed(2)} zł
              </Text>
            </View>
          </>
        )}

        {previewData.type === 'PCC-3' && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Liczba transakcji:</Text>
              <Text style={styles.summaryValue}>
                {previewData.summary.transactionCount}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Podatek PCC:</Text>
              <Text style={[styles.summaryValue, styles.positiveAmount]}>
                {previewData.summary.taxDue?.toFixed(2)} zł
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderFormFields = () => {
    if (!previewData) return null;

    const fields = Object.entries(previewData.fields)
      .filter(([key]) => !key.startsWith('_') && key !== 'autoFilled' && key !== 'autoFillDate' && key !== 'dataSource')
      .slice(0, 10); // Show first 10 fields

    return (
      <View style={styles.fieldsSection}>
        <Text style={styles.sectionTitle}>Pola formularza</Text>
        {fields.map(([key, value]) => (
          <View key={key} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{key}:</Text>
            <Text style={styles.fieldValue}>
              {typeof value === 'number' ? value.toFixed(2) : String(value)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSignatureSelection = () => {
    return (
      <View style={styles.signatureSection}>
        <Text style={styles.sectionTitle}>Metoda podpisu</Text>
        {signatureMethods.map((method) => (
          <TouchableOpacity
            key={method.type}
            style={[
              styles.signatureOption,
              selectedSignature === method.type && styles.selectedSignatureOption,
              !method.configured && styles.disabledSignatureOption
            ]}
            onPress={() => method.configured && setSelectedSignature(method.type)}
            disabled={!method.configured}
          >
            <View style={styles.signatureInfo}>
              <Text style={[
                styles.signatureName,
                selectedSignature === method.type && styles.selectedSignatureText,
                !method.configured && styles.disabledSignatureText
              ]}>
                {method.name}
              </Text>
              <Text style={[
                styles.signatureDescription,
                !method.configured && styles.disabledSignatureText
              ]}>
                {method.description}
              </Text>
            </View>
            <View style={styles.signatureStatus}>
              {method.configured ? (
                <Icon name="check-circle" size={20} color="#28A745" />
              ) : (
                <Icon name="error" size={20} color="#FFA500" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie podglądu...</Text>
      </View>
    );
  }

  if (!previewData) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="preview" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Brak danych do wyświetlenia</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Podgląd deklaracji</Text>
        <TouchableOpacity
          style={styles.xmlButton}
          onPress={handleGenerateXML}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon name="description" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Declaration Info */}
      <View style={styles.infoSection}>
        <Text style={styles.declarationTitle}>{previewData.type}</Text>
        <Text style={styles.declarationPeriod}>Okres: {previewData.period}</Text>
        {previewData.fields.autoFilled && (
          <View style={styles.autoFillBadge}>
            <Icon name="auto-awesome" size={16} color="#007AFF" />
            <Text style={styles.autoFillText}>Wypełnione automatycznie</Text>
          </View>
        )}
      </View>

      {/* Summary */}
      {renderSummarySection()}

      {/* Form Fields */}
      {renderFormFields()}

      {/* Signature Selection */}
      {renderSignatureSelection()}

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#007AFF" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Wstecz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (!selectedSignature || generating) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!selectedSignature || generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="send" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Wyślij deklarację</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  xmlButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  declarationTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  declarationPeriod: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  autoFillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoFillText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summarySection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#DC3545',
  },
  negativeAmount: {
    color: '#28A745',
  },
  fieldsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  signatureSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  signatureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedSignatureOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  disabledSignatureOption: {
    opacity: 0.5,
  },
  signatureInfo: {
    flex: 1,
  },
  signatureName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedSignatureText: {
    color: '#007AFF',
  },
  disabledSignatureText: {
    color: '#999',
  },
  signatureDescription: {
    fontSize: 12,
    color: '#666',
  },
  signatureStatus: {
    marginLeft: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
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
  disabledButton: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default DeclarationPreviewScreen;