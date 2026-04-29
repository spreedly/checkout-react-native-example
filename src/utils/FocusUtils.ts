import { Platform, InteractionManager } from 'react-native';
import type { FormFieldType } from '@spreedly/react-native-checkout';

/**
 * Navigate to the next field with proper timing for Android.
 * On Android, we use InteractionManager to defer the focus change
 * until after the current IME action completes, preventing keyboard flickering.
 *
 * @param nextField - The field type to navigate to
 * @param setFocusedField - State setter function for the focused field
 */
export const navigateToNextField = (
  nextField: FormFieldType,
  setFocusedField: (field: FormFieldType | null) => void
): void => {
  if (Platform.OS === 'android') {
    // On Android, defer focus change to allow Compose's focus system
    // and keyboard to stabilize after the IME action
    InteractionManager.runAfterInteractions(() => {
      setFocusedField(nextField);
    });
  } else {
    // On iOS, direct state update works fine
    setFocusedField(nextField);
  }
};
