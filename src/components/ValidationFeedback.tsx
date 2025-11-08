import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export type ValidationType = 'success' | 'warning' | 'error' | 'info';

interface ValidationFeedbackProps {
  type: ValidationType;
  message: string;
  showIcon?: boolean;
  style?: any;
  textStyle?: any;
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  type,
  message,
  showIcon = true,
  style,
  textStyle,
}) => {
  const getIconName = (type: ValidationType): string => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getIconColor = (type: ValidationType): string => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getBackgroundColor = (type: ValidationType): string => {
    switch (type) {
      case 'success': return '#E8F5E8';
      case 'warning': return '#FFF3E0';
      case 'error': return '#FFEBEE';
      case 'info': return '#E3F2FD';
      default: return '#F5F5F5';
    }
  };

  const getBorderColor = (type: ValidationType): string => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#CCC';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(type),
          borderColor: getBorderColor(type),
        },
        style,
      ]}
    >
      {showIcon && (
        <Icon
          name={getIconName(type) as any}
          size={20}
          color={getIconColor(type)}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.message,
          { color: getIconColor(type) },
          textStyle,
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default ValidationFeedback;