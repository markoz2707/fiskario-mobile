import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number | string;
}

interface InvoiceData {
  sellerName: string;
  sellerNip: string;
  buyerName: string;
  buyerNip: string;
  items: InvoiceItem[];
  totalNet: number;
  totalVat: number;
  totalGross: number;
  number: string;
  date: string;
  splitPayment?: boolean;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  style?: any;
}

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' PLN';
};

const formatVatRate = (rate: number | string): string => {
  if (typeof rate === 'string') return rate;
  return `${rate}%`;
};

const calculateItemNet = (item: InvoiceItem): number => {
  return item.quantity * item.unitPrice;
};

const calculateItemVat = (item: InvoiceItem): number => {
  const net = calculateItemNet(item);
  if (typeof item.vatRate === 'string') return 0;
  return net * (item.vatRate / 100);
};

const calculateItemGross = (item: InvoiceItem): number => {
  return calculateItemNet(item) + calculateItemVat(item);
};

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  style,
}) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.invoiceTitle}>FAKTURA VAT</Text>
        <View style={styles.headerDetails}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Numer:</Text>
            <Text style={styles.headerValue}>{invoice.number}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Data wystawienia:</Text>
            <Text style={styles.headerValue}>{invoice.date}</Text>
          </View>
        </View>
      </View>

      {/* MPP Badge */}
      {invoice.splitPayment && (
        <View style={styles.mppBadge}>
          <Icon name="account-balance" size={16} color="#C62828" />
          <Text style={styles.mppText}>Mechanizm podzielonej płatności (MPP)</Text>
        </View>
      )}

      {/* Parties */}
      <View style={styles.partiesContainer}>
        {/* Seller */}
        <View style={styles.partyBox}>
          <Text style={styles.partyHeader}>Sprzedawca</Text>
          <Text style={styles.partyName}>{invoice.sellerName}</Text>
          <View style={styles.nipRow}>
            <Text style={styles.nipLabel}>NIP:</Text>
            <Text style={styles.nipValue}>{invoice.sellerNip}</Text>
          </View>
        </View>

        <View style={styles.partySeparator}>
          <Icon name="arrow-forward" size={20} color="#ccc" />
        </View>

        {/* Buyer */}
        <View style={styles.partyBox}>
          <Text style={styles.partyHeader}>Nabywca</Text>
          <Text style={styles.partyName}>{invoice.buyerName}</Text>
          <View style={styles.nipRow}>
            <Text style={styles.nipLabel}>NIP:</Text>
            <Text style={styles.nipValue}>{invoice.buyerNip}</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.tableContainer}>
        <Text style={styles.sectionTitle}>Pozycje faktury</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colLp]}>Lp.</Text>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Opis</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Ilość</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>Cena j.</Text>
          <Text style={[styles.tableHeaderText, styles.colVat]}>VAT</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Brutto</Text>
        </View>

        {/* Table Rows */}
        {invoice.items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              index % 2 === 1 && styles.tableRowAlt,
            ]}
          >
            <Text style={[styles.tableCell, styles.colLp]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.colDesc]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.colPrice]}>
              {item.unitPrice.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colVat]}>
              {formatVatRate(item.vatRate)}
            </Text>
            <Text style={[styles.tableCell, styles.colTotal]}>
              {calculateItemGross(item).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Razem netto:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.totalNet)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Razem VAT:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.totalVat)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowGross]}>
          <Text style={styles.totalGrossLabel}>Do zapłaty:</Text>
          <Text style={styles.totalGrossValue}>{formatCurrency(invoice.totalGross)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Dokument wygenerowany w systemie FISKARIO
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  header: {
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
  },
  headerDetails: {
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 13,
    color: '#666',
  },
  headerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  mppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  mppText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C62828',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  partiesContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  partyBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  partyHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  nipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nipLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  nipValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  partySeparator: {
    paddingHorizontal: 8,
    paddingTop: 24,
  },
  tableContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  colLp: {
    width: 28,
    textAlign: 'center',
  },
  colDesc: {
    flex: 1,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  colQty: {
    width: 36,
    textAlign: 'center',
  },
  colPrice: {
    width: 56,
    textAlign: 'right',
  },
  colVat: {
    width: 36,
    textAlign: 'center',
  },
  colTotal: {
    width: 60,
    textAlign: 'right',
  },
  totalsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderTopWidth: 2,
    borderTopColor: '#E9ECEF',
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  totalRowGross: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 8,
    marginTop: 4,
  },
  totalGrossLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalGrossValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default InvoiceTemplate;
