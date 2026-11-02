import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import CustomSwitch from '../customSwitch/CustomSwitch';
import {
  AdditionalFieldCatalogueDemo,
  type AdditionalFieldToggleRow,
} from '../../utils/additionalFieldCatalogueSupport';
import { DemoCustomRulePickerRow } from './DemoCustomRulePicker';
import type { DemoCustomValidationKindValue } from '../../utils/demoCustomValidationRecipes';

export type CatalogueCoreNameRule = {
  title: string;
  value: DemoCustomValidationKindValue;
  onChange: (kind: DemoCustomValidationKindValue) => void;
  testID: string;
};

type Props = {
  rows: AdditionalFieldToggleRow[];
  onChange: (rows: AdditionalFieldToggleRow[]) => void;
  showConfig: boolean;
  onToggleShowConfig: () => void;
  accessibilityPrefix?: string;
  isDark?: boolean;
  coreNameRules?: CatalogueCoreNameRule[];
  coreNameSubtitle?: string;
};

const isAndroid = Platform.OS === 'android';

const AdditionalFieldCatalogueCards: React.FC<Props> = ({
  rows,
  onChange,
  showConfig,
  onToggleShowConfig,
  accessibilityPrefix = 'additionalFields',
  isDark = false,
  coreNameRules,
  coreNameSubtitle,
}) => {
  const flags = useMemo(
    () => AdditionalFieldCatalogueDemo.groupFlags(rows),
    [rows]
  );
  const styles = createStyles(isDark);

  const updateRow = (id: string, patch: Partial<AdditionalFieldToggleRow>) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    onChange(
      AdditionalFieldCatalogueDemo.ensureCountryCompanionForUsOnly(next)
    );
  };

  const groups = (
    <>
      <GroupRow
        title="Billing address"
        subtitle={AdditionalFieldCatalogueDemo.billingSubtitle}
        value={flags.billing}
        testID={`${accessibilityPrefix}_group_billing`}
        styles={styles}
        onChange={(enabled) =>
          onChange(
            AdditionalFieldCatalogueDemo.setEnabled(
              AdditionalFieldCatalogueDemo.billingGroupIds,
              enabled,
              rows
            )
          )
        }
      />
      <GroupRow
        title="Shipping address"
        subtitle={AdditionalFieldCatalogueDemo.shippingSubtitle}
        value={flags.shipping}
        testID={`${accessibilityPrefix}_group_shipping`}
        styles={styles}
        onChange={(enabled) =>
          onChange(
            AdditionalFieldCatalogueDemo.setEnabled(
              AdditionalFieldCatalogueDemo.shippingGroupIds,
              enabled,
              rows
            )
          )
        }
      />
      <GroupRow
        title="Email"
        subtitle={AdditionalFieldCatalogueDemo.emailSubtitle}
        value={flags.email}
        testID={`${accessibilityPrefix}_group_email`}
        styles={styles}
        onChange={(enabled) =>
          onChange(
            AdditionalFieldCatalogueDemo.setEnabled(
              AdditionalFieldCatalogueDemo.emailGroupIds,
              enabled,
              rows
            )
          )
        }
      />
    </>
  );

  const fieldRows = rows.map((row) => (
    <View key={row.id} style={styles.fieldBlock}>
      {isAndroid ? (
        <View style={styles.rowBetween}>
          <Text style={[styles.fieldTitle, styles.flex]}>{row.title}</Text>
          <CustomSwitch
            value={row.isEnabled}
            onValueChange={(v) => updateRow(row.id, { isEnabled: v })}
            testID={`${accessibilityPrefix}_${row.id}_enable`}
          />
          <Text
            style={[
              styles.switchLabel,
              styles.reqLabel,
              !row.isEnabled && styles.dimmed,
            ]}
          >
            Req
          </Text>
          <CustomSwitch
            value={row.isRequired}
            disabled={!row.isEnabled}
            onValueChange={(v) => updateRow(row.id, { isRequired: v })}
            testID={`${accessibilityPrefix}_${row.id}_required`}
          />
        </View>
      ) : (
        <>
          <Text style={styles.fieldTitle}>{row.title}</Text>
          <View style={styles.rowBetween}>
            <View style={styles.switchCluster}>
              <Text style={styles.switchLabel}>Enable</Text>
              <CustomSwitch
                value={row.isEnabled}
                onValueChange={(v) => updateRow(row.id, { isEnabled: v })}
                testID={`${accessibilityPrefix}_${row.id}_enable`}
              />
            </View>
            <View style={styles.switchCluster}>
              <Text
                style={[styles.switchLabel, !row.isEnabled && styles.dimmed]}
              >
                Required
              </Text>
              <CustomSwitch
                value={row.isRequired}
                disabled={!row.isEnabled}
                onValueChange={(v) => updateRow(row.id, { isRequired: v })}
                testID={`${accessibilityPrefix}_${row.id}_required`}
              />
            </View>
          </View>
        </>
      )}
      <DemoCustomRulePickerRow
        title={isAndroid ? 'Custom validation' : 'Custom rule'}
        value={row.customRule}
        formFieldType={row.type}
        enabled={row.isEnabled}
        onChange={(customRule) => updateRow(row.id, { customRule })}
        testID={`${accessibilityPrefix}_${row.id}_customRule`}
        isDark={isDark}
      />
    </View>
  ));

  const coreNameSection =
    isAndroid && coreNameRules && coreNameRules.length > 0 ? (
      <>
        <Text style={styles.subheading}>Core name fields</Text>
        {coreNameSubtitle ? (
          <Text style={styles.caption}>{coreNameSubtitle}</Text>
        ) : null}
        {coreNameRules.map((rule) => (
          <DemoCustomRulePickerRow
            key={rule.testID}
            title={rule.title}
            value={rule.value}
            formFieldType={null}
            onChange={rule.onChange}
            testID={rule.testID}
            isDark={isDark}
          />
        ))}
      </>
    ) : null;

  if (isAndroid) {
    return (
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.heading}>Field configuration</Text>
          {coreNameSection}
          <Text style={styles.subheading}>Optional address fields</Text>
          <Text style={styles.caption}>
            Turn on sections or pick individual fields, then assign a custom
            validation preset per enabled row.
          </Text>
          {groups}
          <TouchableOpacity
            onPress={onToggleShowConfig}
            testID={`${accessibilityPrefix}_configShowHide`}
          >
            <Text style={styles.link}>
              {showConfig
                ? 'Hide individual fields'
                : 'Choose individual fields…'}
            </Text>
          </TouchableOpacity>
          {!showConfig && (
            <Text style={styles.caption}>
              Custom validation presets are configured per field in individual
              mode.
            </Text>
          )}
          {showConfig ? fieldRows : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.heading}>Optional address groups</Text>
        <Text style={styles.caption}>
          Turn on a group to enable its fields. Groups also turn on when you
          Enable every field in that group below.
        </Text>
        {groups}
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.heading}>Additional Fields Configuration</Text>
          <TouchableOpacity
            onPress={onToggleShowConfig}
            testID={`${accessibilityPrefix}_configShowHide`}
          >
            <Text style={styles.link}>{showConfig ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {!showConfig && (
          <Text style={styles.caption}>
            Hidden to shorten this screen. Tap Show for Enable billing defaults,
            Disable all, and per-field Enable / Required / Custom rule.
          </Text>
        )}
        {showConfig && (
          <>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  onChange(
                    AdditionalFieldCatalogueDemo.withBillingDefaults(rows)
                  )
                }
                testID={`${accessibilityPrefix}_enableBillingDefaults`}
              >
                <Text style={styles.link}>Enable billing defaults</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  onChange(AdditionalFieldCatalogueDemo.withAllDisabled(rows))
                }
                testID={`${accessibilityPrefix}_disableAll`}
              >
                <Text style={styles.link}>Disable all</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subheading}>Individual fields</Text>
            {fieldRows}
          </>
        )}
      </View>
    </View>
  );
};

type GroupRowProps = {
  title: string;
  subtitle: string;
  value: boolean;
  testID: string;
  styles: ReturnType<typeof createStyles>;
  onChange: (enabled: boolean) => void;
};

const GroupRow: React.FC<GroupRowProps> = ({
  title,
  subtitle,
  value,
  testID,
  styles,
  onChange,
}) => (
  <View style={styles.groupRow}>
    <View style={styles.flex}>
      <Text style={styles.fieldTitle}>{title}</Text>
      <Text style={styles.caption}>{subtitle}</Text>
    </View>
    <CustomSwitch value={value} onValueChange={onChange} testID={testID} />
  </View>
);

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrap: { gap: 12, marginBottom: 16 },
    card: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E5EA',
    },
    heading: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFF' : '#111',
      marginBottom: 6,
    },
    subheading: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#EEE' : '#222',
      marginTop: 8,
      marginBottom: 4,
    },
    caption: {
      fontSize: 12,
      color: isDark ? '#AAA' : '#666',
      marginBottom: 8,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    actions: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 8,
    },
    link: {
      color: '#0077C8',
      fontSize: 13,
      fontWeight: '600',
      marginVertical: 8,
    },
    fieldBlock: {
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? '#333' : '#E5E5EA',
    },
    fieldTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#FFF' : '#111',
      marginBottom: 4,
    },
    switchCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    switchLabel: {
      fontSize: 12,
      color: isDark ? '#DDD' : '#333',
    },
    reqLabel: {
      marginLeft: 4,
    },
    dimmed: { opacity: 0.45 },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    flex: { flex: 1 },
  });

export default AdditionalFieldCatalogueCards;
