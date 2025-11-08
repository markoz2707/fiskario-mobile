import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  Modal
} from 'react-native';
import { useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { RootState } from '../../store';

interface JPKV7GenerationData {
  period: string;
  variant: 'M' | 'K';
  companyId: string;
  signatureType: 'profil_zaufany' | 'qes' | 'none';
}

interface JPKV7Result {
  success: boolean;
  xmlContent?: string;
  validationResult?: any;
  signatureResult?: any;
  calculationData?: any;
  errors: string[];
  warnings: string[];
  metadata?: {
    generatedAt: Date;
    processingTime: number;
    version: string;
  };
}

const JPKV7Screen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [xmlPreview, setXmlPreview] = useState('');

  const [formData, setFormData] = useState<JPKV7GenerationData>({
    period: new Date().toISOString().slice(0, 7), // YYYY-MM format
    variant: 'M',
    companyId: currentCompany?.id || '',
    signatureType: 'none'
  });

  const [generationResult, setGenerationResult] = useState<JPKV7Result | null>(null);

  // Generate JPK_V7
  const generateJPKV7 = async () => {
    if (!currentCompany) {
      Alert.alert('Error', 'No company selected');
      return;
    }

    setLoading(true);
    try {
      // For now, simulate API call - in production, this would use the actual API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      // Mock response for demonstration
      const mockResult: JPKV7Result = {
        success: true,
        xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<JPK xmlns="http://jpk.mf.gov.pl/wersja/v7">
  <Naglowek>
    <KodFormularza>JPK_V7${formData.variant}</KodFormularza>
    <WariantFormularza>${formData.variant}</WariantFormularza>
    <DataWytworzeniaJPK>${new Date().toISOString().split('T')[0]}</DataWytworzeniaJPK>
    <NazwaSystemu>Fiskario</NazwaSystemu>
  </Naglowek>
  <Podmiot1>
    <NIP>${currentCompany.nip}</NIP>
    <PelnaNazwa>${currentCompany.name}</PelnaNazwa>
  </Podmiot1>
  <!-- Generated JPK_V7 content would be here -->
</JPK>`,
        validationResult: {
          isValid: true,
          errors: [],
          warnings: []
        },
        errors: [],
        warnings: [],
        metadata: {
          generatedAt: new Date(),
          processingTime: 2000,
          version: '1.0'
        }
      };

      setGenerationResult(mockResult);
      setXmlPreview(mockResult.xmlContent || '');
      setShowPreview(true);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate JPK_V7');
    } finally {
      setLoading(false);
    }
  };

  // Validate XML
  const validateXML = async () => {
    if (!xmlPreview) {
      Alert.alert('Error', 'No XML content to validate');
      return;
    }

    setLoading(true);
    try {
      // Mock validation for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Validation Result',
        'Valid: Yes\nErrors: 0\nWarnings: 0'
      );
    } catch (error: any) {
      Alert.alert('Error', 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  // Share/Download XML
  const shareXML = async () => {
    if (!xmlPreview) {
      Alert.alert('Error', 'No XML content to share');
      return;
    }

    try {
      const filename = `JPK_V7${formData.variant}_${formData.period}.xml`;
      await Share.share({
        message: xmlPreview,
        title: filename,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share XML');
    }
  };

  // Get current period options
  const getPeriodOptions = () => {
    const options = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7);
      options.push(period);
    }

    return options;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>JPK_V7 Generator</Text>

      {/* Company Info */}
      {currentCompany && (
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{currentCompany.name}</Text>
          <Text style={styles.companyNip}>NIP: {currentCompany.nip}</Text>
        </View>
      )}

      {/* Generation Form */}
      <View style={styles.form}>
        {/* Period Selection */}
        <Text style={styles.label}>Period</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.period}
            onValueChange={(value: string) => setFormData({...formData, period: value})}
            style={styles.picker}
          >
            {getPeriodOptions().map(period => (
              <Picker.Item key={period} label={period} value={period} />
            ))}
          </Picker>
        </View>

        {/* Variant Selection */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.variant}
            onValueChange={(value: 'M' | 'K') => setFormData({...formData, variant: value})}
            style={styles.picker}
          >
            <Picker.Item label="Monthly (JPK_V7M)" value="M" />
            <Picker.Item label="Quarterly (JPK_V7K)" value="K" />
          </Picker>
        </View>

        {/* Signature Type */}
        <Text style={styles.label}>Signature Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.signatureType}
            onValueChange={(value: 'profil_zaufany' | 'qes' | 'none') =>
              setFormData({...formData, signatureType: value})
            }
            style={styles.picker}
          >
            <Picker.Item label="No Signature" value="none" />
            <Picker.Item label="Profil Zaufany" value="profil_zaufany" />
            <Picker.Item label="Qualified Electronic Signature" value="qes" />
          </Picker>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={generateJPKV7}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Generate JPK_V7</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section */}
      {generationResult && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Generation Results</Text>

          {/* Validation Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.label}>Validation Status:</Text>
            <Text style={[
              styles.status,
              generationResult.validationResult?.isValid ? styles.statusValid : styles.statusInvalid
            ]}>
              {generationResult.validationResult?.isValid ? 'Valid' : 'Invalid'}
            </Text>
          </View>

          {/* Errors and Warnings */}
          {generationResult.errors.length > 0 && (
            <View style={styles.errorsContainer}>
              <Text style={styles.errorsTitle}>Errors:</Text>
              {generationResult.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}

          {generationResult.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              <Text style={styles.warningsTitle}>Warnings:</Text>
              {generationResult.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>• {warning}</Text>
              ))}
            </View>
          )}

          {/* Action Buttons for Results */}
          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={validateXML}
            >
              <Text style={styles.secondaryButtonText}>Validate XML</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={shareXML}
            >
              <Text style={styles.secondaryButtonText}>Share/Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* XML Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>JPK_V7 XML Preview</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.xmlPreview}>
            <Text style={styles.xmlText}>{xmlPreview}</Text>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={shareXML}
            >
              <Text style={styles.modalButtonText}>Share XML</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  companyInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  companyNip: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusValid: {
    color: '#4CAF50',
  },
  statusInvalid: {
    color: '#F44336',
  },
  errorsContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginBottom: 2,
  },
  warningsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#F57C00',
    marginBottom: 2,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  xmlPreview: {
    flex: 1,
    padding: 16,
  },
  xmlText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 16,
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JPKV7Screen;