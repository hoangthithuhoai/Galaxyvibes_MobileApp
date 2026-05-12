import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Animated as RNAnimated,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface Star {
  id: number;
  content: string;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  sentimentColor?: string;
}

interface Universe3DProps {
  stars: Star[];
  onStarPress?: (star: Star) => void;
}

// Hạt nền nhấp nháy (dùng RNAnimated để tránh lỗi)
const Particle = ({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) => {
  const fadeAnim = useRef(new RNAnimated.Value(opacity)).current;

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(fadeAnim, {
          toValue: opacity * 0.3,
          duration: 800 + Math.random() * 1200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: opacity,
          duration: 800 + Math.random() * 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <RNAnimated.View
      style={[
        styles.particle,
        { left: x, top: y, width: size, height: size, borderRadius: size / 2, opacity: fadeAnim },
      ]}
    />
  );
};

const BACKGROUND_PARTICLES = Array.from({ length: 60 }).map((_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: 1 + Math.random() * 2,
  opacity: 0.3 + Math.random() * 0.5,
}));

const Universe3D: React.FC<Universe3DProps> = ({ stars, onStarPress }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const [stableStars, setStableStars] = useState<Star[]>([]);

  useEffect(() => {
    const withCoords = stars.map((star) => ({
      ...star,
      positionX: star.positionX ?? Math.random() * 10,
      positionY: star.positionY ?? Math.random() * 10,
      positionZ: star.positionZ ?? Math.random() * 10,
    }));
    setStableStars(withCoords);
  }, [stars]);

  // Pan – di chuyển
  const panGesture = Gesture.Pan()
    .onChange((event) => {
      translateX.value += event.changeX;
      translateY.value += event.changeY;
    });

  // Pinch – zoom tích lũy, không nhảy
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      // Nhân với savedScale để tiếp tục từ mức zoom hiện tại
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Giới hạn scale trong khoảng 0.3 - 4
      scale.value = Math.min(4, Math.max(0.03, scale.value));
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.background}>
        {/* Hạt nền */}
        {BACKGROUND_PARTICLES.map((p) => (
          <Particle key={p.id} x={p.x} y={p.y} size={p.size} opacity={p.opacity} />
        ))}

        <Animated.View style={[styles.starsContainer, containerAnimatedStyle]}>
          {stableStars.map((star) => {
            const posX = star.positionX!;
            const posY = star.positionY!;
            const posZ = star.positionZ!;
            const color = star.sentimentColor || '#4361EE';
            const size = 18 + posZ * 3;

            return (
              <TouchableOpacity
                key={star.id}
                style={[
                  styles.starTouchable,
                  {
                    width: size + 20,
                    height: size + 20,
                    left: (posX / 10) * width - size / 2 - 10,
                    top: (posY / 10) * height - size / 2 - 10,
                  },
                ]}
                onPress={() => onStarPress?.(star)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.glow,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: color,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.9,
                      shadowRadius: 0.7 * size,
                      elevation: 12,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0a1128',
  },
  starsContainer: {
    flex: 1,
    position: 'relative',
  },
  starTouchable: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    opacity: 0.85,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});

export default Universe3D;