import 'react-native-gesture-handler';
import { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import {
  SpreedlyCore,
  LogLevel,
  ScreenSecurity,
} from '@spreedly/react-native-checkout';

const App = () => {
  useEffect(() => {
    SpreedlyCore.setLogLevel(LogLevel.DEBUG);
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
