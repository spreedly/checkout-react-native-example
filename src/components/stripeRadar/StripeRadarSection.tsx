import React from 'react';
import {
  View,
  Text,
  Switch,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { scaledFont } from '../../styles/typography';

export type RadarState = 'idle' | 'collecting' | 'success' | 'failed';

interface StripeRadarSectionProps {
  enabled: boolean;
  radarState: RadarState;
  radarSessionId: string | null;
  onToggle: (enabled: boolean) => void;
}

const StripeRadarSection: React.FC<StripeRadarSectionProps> = ({
  enabled,
  radarState,
  radarSessionId,
  onToggle,
}) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Stripe Radar</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          testID="stripe-apm-payment-radar-toggle"
          accessibilityLabel="Stripe Radar"
        />
      </View>

      {enabled && (
        <View style={styles.statusRow}>
          {radarState === 'collecting' && (
            <>
              <ActivityIndicator
                size="small"
                color={isDark ? '#60A5FA' : '#3B82F6'}
              />
              <Text
                style={styles.statusText}
                testID="stripe-apm-payment-radar-status-collecting"
                accessibilityLabel="Collecting device data"
              >
                Collecting device data...
              </Text>
            </>
          )}
          {radarState === 'success' && (
            <Text
              style={styles.sessionIdText}
              numberOfLines={1}
              testID="stripe-apm-payment-radar-status-success"
              accessibilityLabel="Radar session ID"
            >
              {radarSessionId ?? ''}
            </Text>
          )}
          {radarState === 'failed' && (
            <Text
              style={styles.failedText}
              testID="stripe-apm-payment-radar-status-failed"
              accessibilityLabel="Radar collection failed"
            >
              Collection failed — payment will proceed without Radar
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: scaledFont(16),
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    statusText: {
      fontSize: scaledFont(12),
      color: isDark ? '#D1D5DB' : '#6B7280',
    },
    sessionIdText: {
      fontSize: scaledFont(12),
      color: isDark ? '#60A5FA' : '#2563EB',
      fontFamily: 'monospace',
      flex: 1,
    },
    failedText: {
      fontSize: scaledFont(12),
      color: '#EF4444',
    },
  });

export default StripeRadarSection;
