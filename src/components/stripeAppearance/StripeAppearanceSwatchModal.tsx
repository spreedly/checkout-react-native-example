import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import type { StripeAppearanceColorField } from '../../config/stripeAPMAppearancePresets';
import { STRIPE_APPEARANCE_SWATCHES } from '../../config/stripeAPMAppearancePresets';

const FIELD_TITLES: Record<StripeAppearanceColorField, string> = {
  primary: 'Primary',
  background: 'Background',
  buttonBackground: 'Pay button background',
  buttonText: 'Pay button text',
};

interface StripeAppearanceSwatchModalProps {
  visible: boolean;
  field: StripeAppearanceColorField | null;
  selectedColor: string;
  onSelectColor: (field: StripeAppearanceColorField, hex: string) => void;
  onClose: () => void;
  styles: ReturnType<typeof import('./Styles').createStripeAppearanceStyles>;
}

const StripeAppearanceSwatchModal: React.FC<
  StripeAppearanceSwatchModalProps
> = ({ visible, field, selectedColor, onSelectColor, onClose, styles }) => {
  if (!field) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="stripe-apm-swatch-modal"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalSheet}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>{FIELD_TITLES[field]}</Text>
            <View style={styles.swatchGrid}>
              {STRIPE_APPEARANCE_SWATCHES.map((hex) => {
                const isSelected =
                  selectedColor.toUpperCase() === hex.toUpperCase();
                return (
                  <TouchableOpacity
                    key={hex}
                    onPress={() => {
                      onSelectColor(field, hex);
                      onClose();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${hex}`}
                    testID={`stripe-apm-swatch-${hex.replace('#', '')}`}
                  >
                    <View
                      style={[
                        styles.swatchItem,
                        { backgroundColor: hex },
                        isSelected && styles.swatchItemSelected,
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={onClose}
              testID="stripe-apm-swatch-modal-close"
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default StripeAppearanceSwatchModal;
