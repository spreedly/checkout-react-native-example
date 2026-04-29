import { StyleSheet } from 'react-native';
import { Blue } from '../../styles/AppColors';

export const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
    backgroundColor: Blue.blue600,
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: Blue.blue600,
  },
  backButton: {
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  backText: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 24,
    marginTop: -2,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
    fontSize: 17,
    lineHeight: 24,
    marginLeft: 4,
    fontFamily: 'Poppins',
  },
  rightSpace: {
    width: 32,
  },
});
