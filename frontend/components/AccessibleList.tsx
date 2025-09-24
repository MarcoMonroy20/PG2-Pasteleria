import React, { useRef, useEffect } from 'react';
import { FlatList, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { AndroidAccessibility } from '../utils/android-optimizations';

interface AccessibleListItem {
  id: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress?: () => void;
  disabled?: boolean;
}

interface AccessibleListProps {
  data: AccessibleListItem[];
  renderItem: (item: AccessibleListItem, index: number) => React.ReactNode;
  keyExtractor?: (item: AccessibleListItem, index: number) => string;
  emptyMessage?: string;
  headerTitle?: string;
  style?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AccessibleList: React.FC<AccessibleListProps> = ({
  data,
  renderItem,
  keyExtractor = (item) => item.id,
  emptyMessage = 'No hay elementos disponibles',
  headerTitle,
  style,
  showsVerticalScrollIndicator = true,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const listRef = useRef<FlatList>(null);
  const currentFocusIndex = useRef(-1);

  useEffect(() => {
    // Anunciar cambios en la lista para lectores de pantalla
    if (data.length > 0) {
      // Screen reader announcement
      const announcement = `${data.length} ${data.length === 1 ? 'elemento' : 'elementos'} disponible${data.length === 1 ? '' : 's'}`;
      // Note: In a real implementation, you'd use AccessibilityInfo.announceForAccessibility
    }
  }, [data.length]);

  const handleItemPress = (item: AccessibleListItem, index: number) => {
    currentFocusIndex.current = index;
    item.onPress?.();
  };

  const renderEmptyComponent = () => (
    <View
      style={{
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="text"
      accessibilityLabel={emptyMessage}
      importantForAccessibility="yes"
    >
      <Text
        style={{
          fontSize: AndroidAccessibility.getAccessibleFontSize(16),
          color: '#999999',
          textAlign: 'center',
        }}
      >
        {emptyMessage}
      </Text>
    </View>
  );

  const renderHeaderComponent = () => {
    if (!headerTitle) return null;

    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#F5F5F5',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
        accessibilityRole="header"
        accessibilityLabel={`Encabezado: ${headerTitle}`}
        importantForAccessibility="yes"
      >
        <Text
          style={{
            fontSize: AndroidAccessibility.getAccessibleFontSize(18),
            fontWeight: 'bold',
            color: '#5E336F',
          }}
        >
          {headerTitle}
        </Text>
      </View>
    );
  };

  const enhancedRenderItem = ({ item, index }: { item: AccessibleListItem; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === data.length - 1;

    return (
      <View
        style={{
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: '#E0E0E0',
        }}
        accessibilityElementsHidden={false}
        importantForAccessibility="yes"
      >
        <TouchableOpacity
          onPress={() => handleItemPress(item, index)}
          disabled={item.disabled}
          accessibilityLabel={item.accessibilityLabel}
          accessibilityHint={item.accessibilityHint || `Presiona para seleccionar elemento ${index + 1} de ${data.length}`}
          accessibilityRole="button"
          accessibilityState={{
            disabled: item.disabled,
            selected: currentFocusIndex.current === index,
          }}
          accessibilityValue={{
            text: `${index + 1} de ${data.length}`,
          }}
          importantForAccessibility="yes"
          style={{
            minHeight: AndroidAccessibility.minTouchTarget,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: currentFocusIndex.current === index ? '#F0F0F0' : 'transparent',
          }}
        >
          {renderItem(item, index)}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[{ flex: 1 }, style]}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={enhancedRenderItem}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={renderHeaderComponent}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        accessibilityLabel={accessibilityLabel || `${headerTitle || 'Lista'} con ${data.length} elementos`}
        accessibilityHint={accessibilityHint || 'Lista desplazable. Usa gestos de deslizamiento para navegar.'}
        accessibilityRole="list"
        importantForAccessibility="yes"
        keyboardShouldPersistTaps="handled"
        {...props}
      />
    </View>
  );
};

export default AccessibleList;
