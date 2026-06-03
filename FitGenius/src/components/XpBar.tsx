import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles';

interface XpBarProps {
  level: number;
  xp: number;
  xpProgress: number;
  levelStartXp: number;
  levelEndXp: number;
}

export default function XpBar({ level, xp, xpProgress, levelStartXp, levelEndXp }: XpBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
        <View style={styles.xpInfo}>
          <Text style={styles.xpLabel}>NIVEL {level}</Text>
          <Text style={styles.xpValue}>{xp} XP</Text>
        </View>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
      </View>
      <View style={styles.xpRange}>
        <Text style={styles.xpRangeText}>{levelStartXp} XP</Text>
        <Text style={styles.xpRangeText}>{levelEndXp} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  xpInfo: {
    flex: 1,
  },
  xpLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  xpValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 2,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  xpRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpRangeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
