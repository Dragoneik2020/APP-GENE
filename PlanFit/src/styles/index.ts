import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#4A90FF',
  primaryDark: '#357ABD',
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceLight: '#2D2D2D',
  text: '#FFFFFF',
  textSecondary: '#B2BEC3',
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  accent: '#6C5CE7',
  card: '#1E1E1E',
};

export const globalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
  cardText: { fontSize: 14, color: colors.textSecondary },
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 5 },
});
