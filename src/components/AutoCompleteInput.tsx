import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Animated,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface AutoCompleteItem {
  id: string;
  label: string;
  value: any;
  subtitle?: string;
}

interface AutoCompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: AutoCompleteItem) => void;
  placeholder?: string;
  data: AutoCompleteItem[];
  filterFunction?: (item: AutoCompleteItem, query: string) => boolean;
  renderItem?: (item: AutoCompleteItem, onPress: () => void) => React.ReactElement;
  maxResults?: number;
  minQueryLength?: number;
  style?: any;
  inputStyle?: any;
  listStyle?: any;
  showClearButton?: boolean;
  disabled?: boolean;
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  value,
  onChangeText,
  onSelect,
  placeholder = 'Wyszukaj...',
  data,
  filterFunction,
  renderItem,
  maxResults = 5,
  minQueryLength = 1,
  style,
  inputStyle,
  listStyle,
  showClearButton = true,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [filteredData, setFilteredData] = useState<AutoCompleteItem[]>([]);
  const [animation] = useState(new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);

  const defaultFilter = (item: AutoCompleteItem, query: string): boolean => {
    const searchText = query.toLowerCase();
    return Boolean(
      item.label.toLowerCase().includes(searchText) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchText))
    );
  };

  const defaultRenderItem = (item: AutoCompleteItem, onPress: () => void) => (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{item.label}</Text>
        {item.subtitle && (
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      <Icon name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  useEffect(() => {
    if (value.length >= minQueryLength) {
      const filter = filterFunction || defaultFilter;
      const filtered = data
        .filter(item => filter(item, value))
        .slice(0, maxResults);
      setFilteredData(filtered);
      setIsVisible(filtered.length > 0);
    } else {
      setFilteredData([]);
      setIsVisible(false);
    }
  }, [value, data, minQueryLength, maxResults, filterFunction]);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isVisible, animation]);

  const handleSelect = (item: AutoCompleteItem) => {
    onSelect(item);
    setIsVisible(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (value.length >= minQueryLength && filteredData.length > 0) {
      setIsVisible(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow item selection
    setTimeout(() => setIsVisible(false), 200);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {showClearButton && value.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {isVisible && (
        <Animated.View
          style={[
            styles.listContainer,
            listStyle,
            {
              opacity: animation,
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
            },
          ]}
        >
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const render = renderItem || defaultRenderItem;
              return render(item, () => handleSelect(item));
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  listContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1001,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default AutoCompleteInput;