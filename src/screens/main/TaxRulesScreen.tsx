import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  useGetTaxFormsQuery,
  useUpdateCompanyTaxSettingsMutation,
} from '../../store/api/apiSlice';

const TaxRulesScreen: React.FC = () => {
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const currentCompany = useSelector((state: RootState) => state.company.currentCompany);

  // Use API hooks
  const { data: taxForms = [], isLoading, error } = useGetTaxFormsQuery({});
  const [updateCompanyTaxSettings] = useUpdateCompanyTaxSettingsMutation();

  const handleFormSelect = (formId: string) => {
    setSelectedForm(selectedForm === formId ? null : formId);
  };

  const handleToggleTaxForm = async (taxFormId: string, isSelected: boolean) => {
    if (!currentCompany?.id) {
      Alert.alert('Error', 'No company selected');
      return;
    }

    try {
      await updateCompanyTaxSettings({
        companyId: currentCompany.id,
        taxFormId,
        isSelected,
      }).unwrap();

      Alert.alert('Success', `Tax form ${isSelected ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating tax form settings:', error);
      Alert.alert('Error', 'Failed to update tax form settings');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tax forms...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tax Rules Configuration</Text>
        <Text style={styles.subtitle}>
          Configure taxation forms for {currentCompany?.name || 'your company'}
        </Text>
      </View>

      <View style={styles.formsContainer}>
        {taxForms.map((form: any) => (
          <View key={form.id} style={styles.formCard}>
            <TouchableOpacity
              style={styles.formHeader}
              onPress={() => handleFormSelect(form.id)}
            >
              <View style={styles.formInfo}>
                <Text style={styles.formName}>{form.name}</Text>
                <Text style={styles.formDescription}>{form.description}</Text>
                <Text style={styles.formCategory}>Category: {form.category}</Text>
              </View>
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    form.isSelected ? styles.activeButton : styles.inactiveButton,
                  ]}
                  onPress={() => handleToggleTaxForm(form.id, !form.isSelected)}
                >
                  <Text style={[
                    styles.toggleButtonText,
                    form.isSelected ? styles.activeButtonText : styles.inactiveButtonText,
                  ]}>
                    {form.isSelected ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {selectedForm === form.id && form.rules && form.rules.length > 0 && (
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesTitle}>Tax Rules:</Text>
                {form.rules.map((rule: any) => (
                  <View key={rule.id} style={styles.ruleCard}>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                    <Text style={styles.ruleDetails}>
                      Type: {rule.ruleType} | Method: {rule.calculationMethod}
                    </Text>
                    <Text style={styles.ruleValue}>Value: {rule.value}%</Text>
                    {rule.minBase && (
                      <Text style={styles.ruleBase}>Min Base: {rule.minBase} PLN</Text>
                    )}
                    {rule.maxBase && (
                      <Text style={styles.ruleBase}>Max Base: {rule.maxBase} PLN</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {taxForms.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tax forms available</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formsContainer: {
    padding: 15,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  formInfo: {
    flex: 1,
  },
  formName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  formCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  formActions: {
    marginLeft: 15,
  },
  toggleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  inactiveButton: {
    backgroundColor: '#ccc',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeButtonText: {
    color: '#fff',
  },
  inactiveButtonText: {
    color: '#666',
  },
  rulesContainer: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ruleCard: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  ruleDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  ruleValue: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  ruleBase: {
    fontSize: 11,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TaxRulesScreen;