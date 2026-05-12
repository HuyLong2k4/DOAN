import { StyleSheet, Text, View } from 'react-native';

type Props = {
  dotColor: string;
  label: string;
  time: string;
};

export function TimelineRow({ dotColor, label, time }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  label: { fontSize: 13, color: '#222', fontWeight: '500' },
  time: { fontSize: 11, color: '#8A8A8A' },
});
