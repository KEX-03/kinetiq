import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/components/theme';
import { formatDuration } from '@/utils/time';

import { useRestTimer } from './rest-timer-provider';

const ADJUST_SECONDS = 15;
const TICK_MS = 250;

/** Compact countdown pinned to the bottom of every screen while resting. */
export function RestTimerBar() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { timer, adjustRest, skipRest } = useRestTimer();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [timer]);

  if (!timer) return null;

  const remainingMs = Math.max(0, timer.endsAt - now);
  const progress = timer.durationMs > 0 ? Math.min(1, 1 - remainingMs / timer.durationMs) : 1;
  const remaining = formatDuration(Math.ceil(remainingMs / 1000));

  return (
    <SafeAreaView edges={['bottom']} style={[styles.root, { backgroundColor: colors.card }]}>
      <View style={[styles.track, { backgroundColor: colors.fill }]}>
        <View style={[styles.fill, { backgroundColor: colors.tint, width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <View
          style={styles.time}
          accessible
          accessibilityLabel={t('timer.remainingLabel', { time: remaining })}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('timer.rest')}</Text>
          <Text style={[styles.countdown, { color: colors.text }]}>{remaining}</Text>
        </View>
        <BarButton
          title={t('timer.minus', { seconds: ADJUST_SECONDS })}
          accessibilityLabel={t('timer.minusLabel', { seconds: ADJUST_SECONDS })}
          onPress={() => adjustRest(-ADJUST_SECONDS)}
        />
        <BarButton
          title={t('timer.plus', { seconds: ADJUST_SECONDS })}
          accessibilityLabel={t('timer.plusLabel', { seconds: ADJUST_SECONDS })}
          onPress={() => adjustRest(ADJUST_SECONDS)}
        />
        <BarButton title={t('timer.skip')} onPress={skipRest} emphasized />
      </View>
    </SafeAreaView>
  );
}

type BarButtonProps = {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  emphasized?: boolean;
};

function BarButton({ title, accessibilityLabel, onPress, emphasized }: BarButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: emphasized ? colors.tint : colors.fill },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, { color: emphasized ? colors.onTint : colors.tint }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { boxShadow: '0 -1px 6px rgba(0,0,0,0.12)' },
  track: { height: 4 },
  fill: { height: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  time: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  countdown: { fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  button: {
    minWidth: 56,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
