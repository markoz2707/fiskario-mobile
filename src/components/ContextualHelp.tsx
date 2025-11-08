import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ContextualHelpProps {
  title: string;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  triggerComponent?: React.ReactNode;
  showCloseButton?: boolean;
  modalStyle?: any;
  overlayStyle?: any;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  title,
  content,
  position = 'center',
  triggerComponent,
  showCloseButton = true,
  modalStyle,
  overlayStyle,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const showHelp = () => {
    setIsVisible(true);
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const hideHelp = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setIsVisible(false));
  };

  const getModalStyle = () => {
    const baseStyle = {
      opacity: animation,
      transform: [
        {
          scale: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          top: 100,
          left: 20,
          right: 20,
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: 100,
          left: 20,
          right: 20,
        };
      case 'left':
        return {
          ...baseStyle,
          top: height * 0.3,
          left: 20,
          width: width * 0.8,
        };
      case 'right':
        return {
          ...baseStyle,
          top: height * 0.3,
          right: 20,
          width: width * 0.8,
        };
      case 'center':
      default:
        return {
          ...baseStyle,
          top: height * 0.25,
          left: 40,
          right: 40,
          maxHeight: height * 0.6,
        };
    }
  };

  const defaultTrigger = (
    <TouchableOpacity style={styles.helpButton} onPress={showHelp}>
      <Icon name="help-outline" size={20} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <>
      {triggerComponent ? (
        <TouchableOpacity onPress={showHelp}>
          {triggerComponent}
        </TouchableOpacity>
      ) : (
        defaultTrigger
      )}

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={hideHelp}
      >
        <TouchableOpacity
          style={[styles.overlay, overlayStyle]}
          activeOpacity={1}
          onPress={hideHelp}
        >
          <Animated.View
            style={[
              styles.modal,
              getModalStyle(),
              modalStyle,
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity onPress={hideHelp} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.content}>
              {typeof content === 'string' ? (
                <Text style={styles.contentText}>{content}</Text>
              ) : (
                content
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  helpButton: {
    padding: 8,
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default ContextualHelp;