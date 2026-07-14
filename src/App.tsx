import 'react-native-gesture-handler';
import { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import {
  SpreedlyCore,
  LogLevel,
  ScreenSecurity,
} from '@spreedly/react-native-checkout';

const App = () => {
  useEffect(() => {
    // Configure log levels for the SDK
    SpreedlyCore.setLogLevel(LogLevel.DEBUG);

    // Set the Datadog log level (logs sent to Datadog if configured)
    SpreedlyCore.setDatadogLogLevel(LogLevel.DEBUG);
  }, []);

  useEffect(() => {
    ScreenSecurity.activateProtection({
      backgroundColor: '#FFFFFF',
    }).catch(console.error);

    return () => {
      ScreenSecurity.deactivateProtection().catch(console.error);
    };
  }, []);

  return <AppNavigator />;
};

export default App;
