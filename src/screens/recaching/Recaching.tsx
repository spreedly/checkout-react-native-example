import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CustomSwitch from '../../components/customSwitch/CustomSwitch';
import CustomField from '../../components/customField/CustomField';
import { createStyles } from './Styles';
import {
  SpreedlyCore,
  SpreedlyEventEmitter,
  SpreedlyEventTypes,
  mapPaymentResult,
  PresentationMode,
  type PaymentResultRN,
} from '@spreedly/react-native-checkout';
import { useSpreedlyInit } from '../../hooks/useSpreedlyInit';
import CustomButton from '../../components/customButton/CustomButton';
import {
  DefaultThemeConfig,
  DarkThemeConfig,
  PurpleThemeConfig,
  PurpleDarkThemeConfig,
  GreenThemeConfig,
  GreenDarkThemeConfig,
  BlueThemeConfig,
  BlueDarkThemeConfig,
} from '../../config/SpreedlyConfig';
import {
  fetchPaymentMethods,
  type PaymentMethod,
} from '../../network/paymentMethods';
import ErrorView from '../../components/errorView/ErrorView';

// Enum for theme configuration types
enum ThemeConfigType {
  DEFAULT = 'DEFAULT',
  PURPLE = 'PURPLE',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
}

interface RecachingProps {}

const Recaching: React.FC<RecachingProps> = ({}) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  const { isLoading, initError, initSpreedly } = useSpreedlyInit();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<PaymentMethod | null>(null);
  const [recachedToken, setRecachedToken] = useState<string | null>(null);
  const [labelText, setLabelText] = useState<string>('');
  const [placeholderText, setPlaceholderText] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('');
  const [cancelButtonText, setCancelButtonText] = useState<string>('');
  const [useCustomTheme, setUseCustomTheme] = useState<boolean>(false);
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfigType>(
    ThemeConfigType.DEFAULT
  );
  const [presentationMode, setPresentationMode] = useState<PresentationMode>(
    PresentationMode.BOTTOM_SHEET
  );

  // Validation options
  const [allowBlankName, setAllowBlankName] = useState<boolean>(false);
  const [allowExpiredDate, setAllowExpiredDate] = useState<boolean>(false);
  const [allowBlankDate, setAllowBlankDate] = useState<boolean>(false);

  useEffect(() => {
    const subscription = SpreedlyEventEmitter.addListener(
      SpreedlyEventTypes.RECACHE_RESULT,
      (result: PaymentResultRN) => {
        const mapped = mapPaymentResult(result);

        switch (mapped.kind) {
          case 'initial':
            setErrorMessage(null);
            break;
          case 'canceled':
            setErrorMessage('CVV recaching cancelled by user');
            setRecachedToken(null);
            break;
          case 'failed':
            if ((result as any).status !== 'processing') {
              setErrorMessage(mapped.message);
            }
            setRecachedToken(null);
            break;
          case 'success':
            setRecachedToken(mapped.token);
            setErrorMessage(null);
            break;
          case 'validation':
            setErrorMessage(mapped.message);
            setRecachedToken(null);
            break;
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Fetch saved payment methods.
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setLoadingCards(true);

        const cards = await fetchPaymentMethods();
        setSavedCards(cards);
      } catch (error) {
        console.error('Failed to fetch payment methods:');
      } finally {
        setLoadingCards(false);
      }
    };

    loadPaymentMethods();
  }, []);

  // Gets the display name for the currently selected theme
  const getCurrentThemeName = (): string => {
    if (!useCustomTheme) {
      return 'Default';
    }

    switch (selectedTheme) {
      case ThemeConfigType.BLUE:
        return 'Blue';
      case ThemeConfigType.PURPLE:
        return 'Purple';
      case ThemeConfigType.GREEN:
        return 'Green';
      default:
        return 'Default';
    }
  };

  // Handles theme toggle - resets to default when disabled
  const toggleThemeSelection = () => {
    const newValue = !useCustomTheme;
    setUseCustomTheme(newValue);
    if (!newValue) {
      setSelectedTheme(ThemeConfigType.DEFAULT);
    }
  };

  // Gets the light theme configuration object based on selected theme
  const getSelectedConfigObject = () => {
    if (!useCustomTheme) {
      return DefaultThemeConfig;
    }

    switch (selectedTheme) {
      case ThemeConfigType.DEFAULT:
        return DefaultThemeConfig;
      case ThemeConfigType.BLUE:
        return BlueThemeConfig;
      case ThemeConfigType.PURPLE:
        return PurpleThemeConfig;
      case ThemeConfigType.GREEN:
        return GreenThemeConfig;
      default:
        return DefaultThemeConfig;
    }
  };

  // Gets the dark theme configuration object based on selected theme
  const getSelectedDarkConfigObject = () => {
    if (!useCustomTheme) {
      return DarkThemeConfig;
    }

    switch (selectedTheme) {
      case ThemeConfigType.DEFAULT:
        return DarkThemeConfig;
      case ThemeConfigType.BLUE:
        return BlueDarkThemeConfig;
      case ThemeConfigType.PURPLE:
        return PurpleDarkThemeConfig;
      case ThemeConfigType.GREEN:
        return GreenDarkThemeConfig;
      default:
        return DarkThemeConfig;
    }
  };

  const handleCardSelect = (card: PaymentMethod) => {
    setSelectedCard(card);
    setErrorMessage(null);
  };

  // Calls the native recachePaymentMethod with configuration
  const handleRecacheCVV = () => {
    if (isLoading) return;

    if (!selectedCard) {
      setErrorMessage('Please select a card first');
      return;
    }

    try {
      let config: any = {
        presentationMode: presentationMode,
        cardInfo: {
          lastFourDigits: selectedCard.lastFourDigits,
          cardType: selectedCard.cardType,
          cardBrand: selectedCard.cardBrand,
        },
        labelText: labelText || 'CVV',
        placeholderText: placeholderText || '123',
        buttonText: buttonText || 'Confirm',
        cancelButtonText: cancelButtonText || 'Cancel',
        allowBlankName,
        allowExpiredDate,
        allowBlankDate,
      };

      if (useCustomTheme) {
        config.theme = getSelectedConfigObject();
        config.darkTheme = getSelectedDarkConfigObject();
      }

      SpreedlyCore.recachePaymentMethod({
        paymentMethodToken: selectedCard.paymentMethodToken,
        config,
      });

      setErrorMessage(null);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      setRecachedToken(null);
      Alert.alert('Error', errorMsg);
    }
  };

  // Resets theme to default
  const handleResetTheme = () => {
    setSelectedTheme(ThemeConfigType.DEFAULT);
  };

  // Renders the header section with title and description
  const renderHeaderSection = () => (
    <View style={styles.headerSection}>
      <Text style={styles.title} testID="cvv-recaching-title">
        CVV Recaching
      </Text>
      <Text style={styles.subtitle} testID="cvv-recaching-subtitle">
        Update CVV for saved payment methods to enable repeat transactions
      </Text>
    </View>
  );

  // Renders the information section explaining CVV recaching
  const renderInformationSection = () => (
    <View style={styles.infoContainer} testID="cvv-info-section">
      <Text style={styles.infoTitle}>About CVV Recaching:</Text>
      <Text style={styles.infoText}>
        • CVV values cannot be stored for security compliance
      </Text>
      <Text style={styles.infoText}>
        • Recaching updates the CVV for saved payment methods
      </Text>
      <Text style={styles.infoText}>
        • SDK provides secure UI for CVV entry
      </Text>
      <Text style={styles.infoText}>
        • Updated payment method can be used for transactions
      </Text>
    </View>
  );

  // Renders the configuration section with UI customization options
  const renderConfigurationSection = () => (
    <View style={styles.configContainer} testID="config-section">
      <Text style={styles.configTitle}>Configuration Options:</Text>

      <View style={styles.yearFormatRow}>
        <Text style={styles.yearFormatLabel}>Presentation Mode:</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              presentationMode === PresentationMode.BOTTOM_SHEET &&
                styles.segmentButtonActive,
            ]}
            onPress={() => setPresentationMode(PresentationMode.BOTTOM_SHEET)}
            testID="presentation-mode-bottom-sheet"
          >
            <Text
              style={[
                styles.segmentButtonText,
                presentationMode === PresentationMode.BOTTOM_SHEET &&
                  styles.segmentButtonTextActive,
              ]}
            >
              Bottom Sheet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              presentationMode === PresentationMode.DIALOG &&
                styles.segmentButtonActive,
            ]}
            onPress={() => setPresentationMode(PresentationMode.DIALOG)}
            testID="presentation-mode-dialog"
          >
            <Text
              style={[
                styles.segmentButtonText,
                presentationMode === PresentationMode.DIALOG &&
                  styles.segmentButtonTextActive,
              ]}
            >
              Dialog
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomField
        title="Label Text:"
        value={labelText}
        onChangeText={setLabelText}
        placeholder=""
        testID="label-text-input"
        style={styles.firstFieldContainer}
      />

      <CustomField
        title="Placeholder Text:"
        value={placeholderText}
        onChangeText={setPlaceholderText}
        placeholder=""
        testID="placeholder-text-input"
      />

      <CustomField
        title="Button Text:"
        value={buttonText}
        onChangeText={setButtonText}
        placeholder=""
        testID="button-text-input"
      />

      <CustomField
        title="Cancel Button Text:"
        value={cancelButtonText}
        onChangeText={setCancelButtonText}
        placeholder=""
        testID="cancel-button-text-input"
      />

      <View style={styles.toggleRowContainer}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow Blank Name</Text>
          <CustomSwitch
            value={allowBlankName}
            onValueChange={setAllowBlankName}
            testID="allow-blank-name-toggle"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow Expired Date</Text>
          <CustomSwitch
            value={allowExpiredDate}
            onValueChange={setAllowExpiredDate}
            testID="allow-expired-date-toggle"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow Blank Date</Text>
          <CustomSwitch
            value={allowBlankDate}
            onValueChange={setAllowBlankDate}
            testID="allow-blank-date-toggle"
          />
        </View>
      </View>
    </View>
  );

  // Renders the theme configuration section
  const renderThemeConfigurationSection = () => (
    <View style={styles.themeConfigContainer} testID="theme-config-section">
      <Text style={styles.configTitle}>Theme Configuration:</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Use Custom Theme</Text>
        <CustomSwitch
          value={useCustomTheme}
          onValueChange={toggleThemeSelection}
          testID="use-custom-theme-toggle"
        />
      </View>

      <View style={styles.currentThemeRow}>
        <Text style={styles.currentThemeLabel}>
          Current Theme:{' '}
          <Text style={styles.currentThemeValue} testID="current-theme-text">
            {getCurrentThemeName()}
          </Text>
        </Text>
      </View>

      {useCustomTheme && (
        <>
          <Text style={styles.customThemeLabel}>Custom Theme Colors:</Text>
          <View style={styles.themeButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                styles.blueThemeButton,
                selectedTheme === ThemeConfigType.BLUE &&
                  styles.themeButtonActive,
              ]}
              onPress={() => setSelectedTheme(ThemeConfigType.BLUE)}
              testID="blue-theme-button"
            >
              <Text style={styles.themeButtonText}>Blue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                styles.greenThemeButton,
                selectedTheme === ThemeConfigType.GREEN &&
                  styles.themeButtonActive,
              ]}
              onPress={() => setSelectedTheme(ThemeConfigType.GREEN)}
              testID="green-theme-button"
            >
              <Text style={styles.themeButtonText}>Green</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeButton,
                styles.purpleThemeButton,
                selectedTheme === ThemeConfigType.PURPLE &&
                  styles.themeButtonActive,
              ]}
              onPress={() => setSelectedTheme(ThemeConfigType.PURPLE)}
              testID="purple-theme-button"
            >
              <Text style={styles.themeButtonText}>Purple</Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            title="Reset to Default"
            onPress={handleResetTheme}
            style={styles.resetButton}
            textStyle={styles.resetButtonText}
            testID="reset-theme-button"
          />
        </>
      )}
    </View>
  );

  const renderCardRow = (card: PaymentMethod) => {
    const isSelected = selectedCard?.id === card.id;

    return (
      <TouchableOpacity
        key={card.id}
        style={[styles.cardRow, isSelected && styles.cardRowSelected]}
        onPress={() => handleCardSelect(card)}
        testID={`card-row-${card.id}`}
      >
        <Text style={styles.cardIcon}>{'💳'}</Text>

        <View style={styles.cardInfoContainer}>
          <Text style={styles.cardType}>{card.cardType}</Text>
          <Text style={styles.cardNumber}>•••• {card.lastFourDigits}</Text>
          <Text style={styles.cardExpiry}>
            Expires: {card.expiryMonth}/{card.expiryYear}
          </Text>
        </View>

        <View
          style={[styles.radioButton, isSelected && styles.radioButtonSelected]}
        >
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSavedCardsSection = () => (
    <View style={styles.savedCardsContainer} testID="saved-cards-section">
      <Text style={styles.configTitle}>Saved Payment Methods:</Text>

      {loadingCards && (
        <View style={styles.cardRow}>
          <Text style={styles.noCardsText} testID="loading-cards-text">
            Loading saved cards...
          </Text>
        </View>
      )}

      {!loadingCards && savedCards.length === 0 && (
        <Text style={styles.noCardsText} testID="no-cards-text">
          No saved payment methods
        </Text>
      )}

      {!loadingCards &&
        savedCards.length > 0 &&
        savedCards.slice(0, 3).map((card) => renderCardRow(card))}
    </View>
  );

  // Renders the recache CVV button
  const renderRecacheButton = () => {
    if (!selectedCard) return null;

    return (
      <CustomButton
        title="Recache CVV"
        onPress={handleRecacheCVV}
        disabled={isLoading}
        loading={isLoading}
        loadingText="Initializing...."
        testID="recache-cvv-button"
      />
    );
  };

  // Renders the recached token result when successful
  const renderRecacheResult = () => {
    if (!recachedToken) return null;

    return (
      <View style={styles.resultContainer} testID="result-container">
        <Text style={styles.resultTitle}>Recached Token:</Text>
        <Text style={styles.tokenText}>{recachedToken}</Text>
      </View>
    );
  };

  // Renders error message if present
  const renderErrorMessage = () => {
    if (!errorMessage) return null;

    return (
      <View style={styles.errorContainer} testID="error-message">
        <Text style={styles.errorText}>Error: {errorMessage}</Text>
      </View>
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loadingContainer} />;
  }

  if (initError) {
    return <ErrorView message={initError} onAction={initSpreedly} />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      testID="cvv-recaching-scroll"
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        {renderHeaderSection()}
        {renderInformationSection()}
        {renderConfigurationSection()}
        {renderThemeConfigurationSection()}
        {renderSavedCardsSection()}
        {renderRecacheButton()}
        {renderRecacheResult()}
        {renderErrorMessage()}

        <View style={styles.securityBadge} testID="security-badge">
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Secure CVV recaching</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default Recaching;
