import React, { useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import type { FormFieldType } from '@spreedly/react-native-checkout';
import {
  DEMO_CUSTOM_VALIDATION_PICKER_LABELS,
  pickerCasesForFormField,
  type DemoCustomValidationKindValue,
} from '../../utils/demoCustomValidationRecipes';

type RowProps = {
  title: string;
  value: DemoCustomValidationKindValue;
  formFieldType?: FormFieldType | null;
  enabled?: boolean;
  onChange: (kind: DemoCustomValidationKindValue) => void;
  testID?: string;
  isDark?: boolean;
};

const DROPDOWN_LABELS = new Set(['Custom validation', 'Custom rule']);

/**
 * In-place dropdown on both platforms (Android ExposedDropdown / iOS menu list).
 * Does not use Alert or ActionSheet.
 */
export const DemoCustomRulePickerRow: React.FC<RowProps> = ({
  title,
  value,
  formFieldType,
  enabled = true,
  onChange,
  testID,
  isDark = false,
}) => {
  const styles = createStyles(isDark);
  const [expanded, setExpanded] = useState(false);
  const cases = pickerCasesForFormField(formFieldType);
  const outlinedLabel =
    Platform.OS === 'android' ? 'Custom validation' : 'Custom rule';
  const showTitleAbove = !DROPDOWN_LABELS.has(title);

  return (
    <View style={styles.dropdown} testID={testID}>
      {showTitleAbove ? (
        <Text style={[styles.label, !enabled && styles.dimmed]}>{title}</Text>
      ) : null}
      <TouchableOpacity
        disabled={!enabled}
        onPress={() => setExpanded((open) => !open)}
        style={[styles.outlined, !enabled && styles.dimmed]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled, expanded }}
        testID={`${testID}_anchor`}
      >
        <Text style={styles.outlinedLabel}>{outlinedLabel}</Text>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>
            {DEMO_CUSTOM_VALIDATION_PICKER_LABELS[value]}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▴' : '▾'}</Text>
        </View>
      </TouchableOpacity>
      {expanded && enabled ? (
        <View style={styles.menu}>
          {cases.map((kind) => (
            <TouchableOpacity
              key={kind}
              onPress={() => {
                onChange(kind);
                setExpanded(false);
              }}
              style={styles.menuItem}
              testID={`${testID}_${kind}`}
            >
              <Text
                style={[
                  styles.menuItemText,
                  kind === value && styles.menuItemTextSelected,
                ]}
              >
                {DEMO_CUSTOM_VALIDATION_PICKER_LABELS[kind]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    dropdown: {
      paddingVertical: 6,
      zIndex: 1,
    },
    outlined: {
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#C7C7CC',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    outlinedLabel: {
      fontSize: 11,
      color: isDark ? '#AAA' : '#666',
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      color: isDark ? '#AAA' : '#666',
      flexShrink: 1,
      marginRight: 8,
      marginBottom: 4,
    },
    valueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
    },
    value: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#FFF' : '#111',
      flex: 1,
    },
    chevron: {
      fontSize: 12,
      color: '#0077C8',
    },
    dimmed: { opacity: 0.45 },
    menu: {
      marginTop: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#E5E5EA',
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    menuItem: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#444' : '#E5E5EA',
    },
    menuItemText: {
      fontSize: 14,
      color: isDark ? '#EEE' : '#111',
    },
    menuItemTextSelected: {
      fontWeight: '600',
      color: '#0077C8',
    },
  });
