import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

type DeclarationStatusType =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'correction_needed';

interface DeclarationStatusProps {
  status: DeclarationStatusType;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  showIcon?: boolean;
}

interface StatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
}

const STATUS_MAP: Record<DeclarationStatusType, StatusConfig> = {
  draft: {
    label: 'Szkic',
    color: '#616161',
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
    icon: 'edit',
  },
  submitted: {
    label: 'Złożona',
    color: '#1565C0',
    backgroundColor: '#E3F2FD',
    borderColor: '#64B5F6',
    icon: 'send',
  },
  accepted: {
    label: 'Zaakceptowana',
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
    icon: 'check-circle',
  },
  rejected: {
    label: 'Odrzucona',
    color: '#C62828',
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
    icon: 'cancel',
  },
  correction_needed: {
    label: 'Do korekty',
    color: '#E65100',
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    icon: 'warning',
  },
};

const SIZE_CONFIG = {
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    iconSize: 12,
    borderRadius: 4,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 13,
    iconSize: 16,
    borderRadius: 6,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 15,
    iconSize: 20,
    borderRadius: 8,
  },
};

const DeclarationStatus: React.FC<DeclarationStatusProps> = ({
  status,
  size = 'medium',
  style,
  showIcon = true,
}) => {
  const config = STATUS_MAP[status];
  const sizeConfig = SIZE_CONFIG[size];

  if (!config) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
        },
        style,
      ]}
    >
      {showIcon && (
        <Icon
          name={config.icon as any}
          size={sizeConfig.iconSize}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
  },
});

export default DeclarationStatus;
