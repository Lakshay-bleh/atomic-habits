import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useHaptics } from '@/hooks/useHaptics'
import { useTheme } from '@/hooks/useTheme'
import { Typography, Spacing, Radius } from '@/constants/themes'
import { LinearGradient } from 'expo-linear-gradient'

type FocusMode = 'pomodoro' | 'custom'
const POMODORO_DURATION = 25 * 60  // 25 minutes
const SHORT_BREAK = 5 * 60         // 5 minutes

export default function FocusScreen() {
  const theme = useTheme()
  const haptics = useHaptics()
  const [mode, setMode] = useState<FocusMode>('pomodoro')
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [seconds, setSeconds] = useState(POMODORO_DURATION)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulseOpacity = useSharedValue(1)

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  const totalSeconds = isBreak ? SHORT_BREAK : POMODORO_DURATION
  const progress = 1 - seconds / totalSeconds
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  const start = () => {
    setIsRunning(true)
    haptics.medium()
    pulseOpacity.value = withRepeat(withTiming(0.7, { duration: 1500 }), -1, true)
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          handleTimerEnd()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  const pause = () => {
    setIsRunning(false)
    haptics.light()
    cancelAnimation(pulseOpacity)
    pulseOpacity.value = 1
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const reset = () => {
    pause()
    setSeconds(isBreak ? SHORT_BREAK : POMODORO_DURATION)
  }

  const handleTimerEnd = () => {
    pause()
    Vibration.vibrate([0, 400, 200, 400])
    haptics.success()
    if (!isBreak) {
      setSessions((s) => s + 1)
      setIsBreak(true)
      setSeconds(SHORT_BREAK)
    } else {
      setIsBreak(false)
      setSeconds(POMODORO_DURATION)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const circumference = 2 * Math.PI * 90  // radius 90
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Focus Mode</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: theme.surfaceHigh }]}>
          {(['pomodoro', 'custom'] as FocusMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.modeBtn,
                mode === m && { backgroundColor: theme.primary, borderRadius: Radius.lg },
              ]}
              onPress={() => setMode(m)}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === m ? '#fff' : theme.textSecondary },
                ]}
              >
                {m === 'pomodoro' ? '🍅 Pomodoro' : '⚙️ Custom'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session indicator */}
        <View style={styles.sessions}>
          {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.sessionDot,
                {
                  backgroundColor: i < sessions ? theme.primary : theme.surfaceHigh,
                },
              ]}
            />
          ))}
        </View>

        {/* Timer ring */}
        <Animated.View style={[styles.timerWrapper, pulseStyle]}>
          <LinearGradient
            colors={[`${theme.primary}30`, `${theme.primary}08`]}
            style={[
              styles.timerRing,
              {
                borderColor: isBreak ? theme.success : theme.primary,
                borderWidth: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.timerPhase,
                { color: isBreak ? theme.success : theme.textSecondary },
              ]}
            >
              {isBreak ? '☕ BREAK' : '🎯 FOCUS'}
            </Text>
            <Text style={[styles.timerDisplay, { color: theme.text }]}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
            <Text style={[styles.timerLabel, { color: theme.textMuted }]}>
              {sessions} sessions today
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: theme.surfaceHigh }]}
            onPress={reset}
          >
            <Ionicons name="refresh" size={22} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              { backgroundColor: isBreak ? theme.success : theme.primary },
            ]}
            onPress={isRunning ? pause : start}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={30}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.skipBtn, { backgroundColor: theme.surfaceHigh }]}
            onPress={handleTimerEnd}
          >
            <Ionicons name="play-skip-forward" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View
          style={[styles.tip, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            {isBreak
              ? 'Step away, stretch, or grab water. Rest is part of the system.'
              : 'Turn off notifications. One task only. Depth beats breadth.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: 4,
  },
  modeBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  modeBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  sessions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sessionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timerWrapper: {
    marginVertical: Spacing.lg,
  },
  timerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  timerPhase: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 2,
  },
  timerDisplay: {
    fontSize: 52,
    fontWeight: Typography.weights.extrabold,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: { fontSize: Typography.sizes.xs },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  resetBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  tipIcon: { fontSize: 16 },
  tipText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
})
