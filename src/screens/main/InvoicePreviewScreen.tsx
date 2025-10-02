import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

interface InvoiceOcrResult {
  invoiceNumber?: string;
  issueDate?: string;
  saleDate?: string;
  dueDate?: string;
  type?: 'VAT' | 'PROFORMA' | 'CORRECTIVE' | 'RECEIPT';
  seller?: {
    name?: string;
    address?: string;
    nip?: string;
    phone?: string;
    email?: string;
  };
  buyer?: {
    name?: string;
    address?: string;
    nip?: string;
    phone?: string;
    email?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate?: number;
    totalPrice: number;
  }>;
  netAmount?: number;
  vatAmount?: number;
  grossAmount?: number;
  currency?: string;
  paymentMethod?: string;
  description?: string;
  overallConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore?: number;
  processingNotes?: string;
}

interface RouteParams {
  imageUri?: string;
  ocrResult?: InvoiceOcrResult;
}

export default function InvoicePreviewScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const params = route.params as RouteParams;
  const ocrResult: InvoiceOcrResult = params?.ocrResult || {
    overallConfidence: 'MEDIUM',
    confidenceScore: 0.7,
    processingNotes: 'Mock OCR result for demonstration'
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'LOW': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return 'High Confidence';
      case 'MEDIUM': return 'Medium Confidence';
      case 'LOW': return 'Low Confidence - Review Required';
      default: return 'Unknown Confidence';
    }
  };

  const handleAcceptInvoice = async () => {
    Alert.alert(
      'Accept Invoice',
      'Are you sure you want to accept this invoice data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            setIsLoading(true);

            try {
              // TODO: Send accepted data to backend for storage
              await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call

              setIsAccepted(true);

              Alert.alert(
                'Success',
                'Invoice data has been accepted and saved.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to save invoice data');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectInvoice = () => {
    Alert.alert(
      'Reject Invoice',
      'Are you sure you want to reject this invoice data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          onPress: () => {
            Alert.alert(
              'Invoice Rejected',
              'You can scan the invoice again or enter data manually.',
              [
                {
                  text: 'Scan Again',
                  onPress: () => navigation.goBack(),
                },
                {
                  text: 'Enter Manually',
                  onPress: () => {
                    // TODO: Navigate to manual entry screen
                    navigation.goBack();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRequestManualReview = () => {
    Alert.alert(
      'Request Manual Review',
      'This will flag the invoice for manual review by a human operator.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Request Review',
          onPress: () => {
            Alert.alert('Review Requested', 'Invoice has been flagged for manual review.');
          },
        },
      ]
    );
  };

  const renderConfidenceIndicator = () => (
    <View style={styles.confidenceContainer}>
      <View style={styles.confidenceHeader}>
        <Text style={styles.confidenceTitle}>Processing Confidence</Text>
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: getConfidenceColor(ocrResult.overallConfidence) },
          ]}
        >
          <Text style={styles.confidenceBadgeText}>
            {getConfidenceText(ocrResult.overallConfidence)}
          </Text>
        </View>
      </View>

      {ocrResult.confidenceScore && (
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceProgress,
              {
                width: `${ocrResult.confidenceScore * 100}%`,
                backgroundColor: getConfidenceColor(ocrResult.overallConfidence),
              },
            ]}
          />
        </View>
      )}

      {ocrResult.processingNotes && (
        <Text style={styles.processingNotes}>{ocrResult.processingNotes}</Text>
      )}
    </View>
  );

  const renderInvoiceSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.sectionTitle}>Invoice Summary</Text>

      <View style={styles.summaryGrid}>
        {ocrResult.invoiceNumber && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Invoice Number</Text>
            <Text style={styles.summaryValue}>{ocrResult.invoiceNumber}</Text>
          </View>
        )}

        {ocrResult.type && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Type</Text>
            <Text style={styles.summaryValue}>{ocrResult.type}</Text>
          </View>
        )}

        {ocrResult.grossAmount && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>
              {ocrResult.grossAmount.toFixed(2)} {ocrResult.currency || 'PLN'}
            </Text>
          </View>
        )}

        {ocrResult.issueDate && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Issue Date</Text>
            <Text style={styles.summaryValue}>
              {new Date(ocrResult.issueDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderPartyInfo = (title: string, party: any) => {
    if (!party || (!party.name && !party.nip)) return null;

    return (
      <View style={styles.partyContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {party.name && (
          <View style={styles.partyItem}>
            <Text style={styles.partyLabel}>Name:</Text>
            <Text style={styles.partyValue}>{party.name}</Text>
          </View>
        )}

        {party.nip && (
          <View style={styles.partyItem}>
            <Text style={styles.partyLabel}>NIP:</Text>
            <Text style={styles.partyValue}>{party.nip}</Text>
          </View>
        )}

        {party.address && (
          <View style={styles.partyItem}>
            <Text style={styles.partyLabel}>Address:</Text>
            <Text style={styles.partyValue}>{party.address}</Text>
          </View>
        )}

        {party.phone && (
          <View style={styles.partyItem}>
            <Text style={styles.partyLabel}>Phone:</Text>
            <Text style={styles.partyValue}>{party.phone}</Text>
          </View>
        )}

        {party.email && (
          <View style={styles.partyItem}>
            <Text style={styles.partyLabel}>Email:</Text>
            <Text style={styles.partyValue}>{party.email}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderInvoiceItems = () => {
    if (!ocrResult.items || ocrResult.items.length === 0) return null;

    return (
      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>Items</Text>

        {ocrResult.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × {item.unitPrice.toFixed(2)} {ocrResult.currency || 'PLN'}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              {item.totalPrice.toFixed(2)} {ocrResult.currency || 'PLN'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAmounts = () => (
    <View style={styles.amountsContainer}>
      <Text style={styles.sectionTitle}>Amounts</Text>

      <View style={styles.amountsGrid}>
        {ocrResult.netAmount && (
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Net Amount</Text>
            <Text style={styles.amountValue}>
              {ocrResult.netAmount.toFixed(2)} {ocrResult.currency || 'PLN'}
            </Text>
          </View>
        )}

        {ocrResult.vatAmount && (
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>VAT Amount</Text>
            <Text style={styles.amountValue}>
              {ocrResult.vatAmount.toFixed(2)} {ocrResult.currency || 'PLN'}
            </Text>
          </View>
        )}

        {ocrResult.grossAmount && (
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Gross Amount</Text>
            <Text style={[styles.amountValue, styles.grossAmount]}>
              {ocrResult.grossAmount.toFixed(2)} {ocrResult.currency || 'PLN'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Saving invoice...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Invoice Preview</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Confidence Indicator */}
        {renderConfidenceIndicator()}

        {/* Invoice Summary */}
        {renderInvoiceSummary()}

        {/* Seller Information */}
        {renderPartyInfo('Seller Information', ocrResult.seller)}

        {/* Buyer Information */}
        {renderPartyInfo('Buyer Information', ocrResult.buyer)}

        {/* Invoice Items */}
        {renderInvoiceItems()}

        {/* Amounts */}
        {renderAmounts()}

        {/* Additional Information */}
        {(ocrResult.paymentMethod || ocrResult.description) && (
          <View style={styles.additionalContainer}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            {ocrResult.paymentMethod && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>Payment Method:</Text>
                <Text style={styles.additionalValue}>{ocrResult.paymentMethod}</Text>
              </View>
            )}

            {ocrResult.description && (
              <View style={styles.additionalItem}>
                <Text style={styles.additionalLabel}>Description:</Text>
                <Text style={styles.additionalValue}>{ocrResult.description}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {ocrResult.overallConfidence === 'LOW' && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleRequestManualReview}
            >
              <Text style={styles.reviewButtonText}>Request Manual Review</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleRejectInvoice}
          >
            <Text style={styles.rejectButtonText}>Reject & Rescan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              isAccepted && styles.acceptButtonDisabled,
            ]}
            onPress={handleAcceptInvoice}
            disabled={isAccepted}
          >
            <Text style={styles.acceptButtonText}>
              {isAccepted ? 'Accepted ✓' : 'Accept Invoice'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  confidenceContainer: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  confidenceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 10,
  },
  confidenceProgress: {
    height: '100%',
    borderRadius: 3,
  },
  processingNotes: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  partyContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partyItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  partyLabel: {
    fontSize: 14,
    color: '#666666',
    width: 80,
  },
  partyValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  amountsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountsGrid: {
    gap: 10,
  },
  amountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666666',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  grossAmount: {
    color: '#4CAF50',
    fontSize: 18,
  },
  additionalContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  additionalLabel: {
    fontSize: 14,
    color: '#666666',
    width: 120,
  },
  additionalValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  actionsContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  reviewButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 30,
  },
});