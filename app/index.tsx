import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Thêm thư viện này
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // GIAO DIỆN 1: MÀN HÌNH SPLASH (CẬP NHẬT NỀN ẢNH)
  // ==========================================
  if (showSplash) {
    return (
      <ImageBackground 
        // Thay 'nen-splash.png' bằng tên file ảnh nền bạn muốn dùng cho Splash
        source={require('../assets/images/nen1.png')} 
        style={styles.splashContainer}
        resizeMode="cover"
      >
        <View style={styles.splashRow}>
          {/* Icon hành tinh */}
          <Ionicons name="planet" size={85} color="#FFFFFF" style={styles.splashIcon} />
          
          {/* Chữ thương hiệu */}
          <View>
            <Text style={styles.splashTitle}>Galaxyvibes</Text>
            <Text style={styles.splashSubtitle}>bắt sóng tần số</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // ==========================================
  // GIAO DIỆN 2: MÀN HÌNH ONBOARDING
  // ==========================================
  return (
    <ImageBackground 
      source={require('../assets/images/nen3.png')} 
      style={styles.onboardingContainer}
      resizeMode="cover"
    >
      {/* Thay View bằng LinearGradient.
        Màu sẽ chuyển từ: trong suốt (trên cùng) -> đen mờ (giữa) -> đen đặc (dưới đáy)
      */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,17,40,0.9)']} // Đáy là màu navy cực tối
        locations={[0.4, 0.7, 1]} // Bắt đầu tối từ 40% chiều cao màn hình đổ xuống
        style={styles.overlay}
      >
        
        <View style={styles.bottomSection}>
          <Ionicons name="planet" size={50} color="#FFFFFF" style={styles.smallIcon} />
          
          <Text style={styles.mainTitle}>
            Galaxyvibes
          </Text>
          
          <Text style={styles.descText}>
            Kết nối những tâm hồn đồng điệu trong dải ngân hà
          </Text>

          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
            // Sửa dòng này để chuyển hướng sang màn login
            onPress={() => router.push('/login')} 
          >
            <Text style={styles.buttonText}>Khởi hành ngay</Text>
          </TouchableOpacity>
        </View>

      </LinearGradient>
    </ImageBackground>
  );
}

// ==========================================
// ĐỊNH DẠNG (STYLES)
// ==========================================
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    // Không cần backgroundColor nữa vì đã có ảnh nền
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Thêm một chút đổ bóng cho cụm chữ/icon để nổi bật trên nền ảnh
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  splashIcon: {
    marginRight: 15,
  },
  splashTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#0a1128',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end', 
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 30,
    // Đã tăng từ 60 lên 100 để đẩy toàn bộ nội dung lên cao hơn
    paddingBottom: 100, 
    alignItems: 'center',
  },
  smallIcon: {
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 45,
    marginBottom: 10,
    // Thêm đổ bóng chữ để phát sáng nhẹ
    textShadowColor: 'rgba(255, 255, 255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  descText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4361EE', 
    width: '100%',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    // Thêm đổ bóng cho nút
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});