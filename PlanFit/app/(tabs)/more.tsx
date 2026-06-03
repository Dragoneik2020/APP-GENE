import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../src/styles';

export default function MoreScreen() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const toggleTimer = () => {
    if (running) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else {
      intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
    setRunning(!running);
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setTime(0);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Cronómetro</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timer}>{formatTime(time)}</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, running ? styles.btnPause : styles.btnStart]} onPress={toggleTimer}>
            <Text style={styles.btnText}>{running ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnReset]} onPress={resetTimer}>
            <Text style={styles.btnText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
  timerCard: { backgroundColor: colors.card, borderRadius: 20, padding: 40, alignItems: 'center', marginBottom: 32 },
  timer: { fontSize: 64, fontWeight: 'bold', color: colors.text, fontVariant: ['tabular-nums'] },
  btnRow: { flexDirection: 'row', gap: 16 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnStart: { backgroundColor: colors.success },
  btnPause: { backgroundColor: colors.warning },
  btnReset: { backgroundColor: colors.surfaceLight },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
