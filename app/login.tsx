import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  // Quản lý state cho input
  const [identity, setIdentity] = useState(''); // Email hoặc Username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identity || !password) {
      alert("Vui lòng nhập định danh và mật khẩu!");
      return;
    }

    try {
      // GỌI API ĐĂNG NHẬP
      const response = await api.post('/Auth/login', {
        username: identity, // Nhớ dùng identity nhé
        password: password
      });

      if (response.status === 200) {

        console.log("TOKEN CỦA TÔI:", response.data.token);
        // Lưu thẻ bài Token lại
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.userId.toString());
        await AsyncStorage.setItem('userRole', response.data.role);

        // Chuyển vào trang chủ
        router.replace('/(tabs)'); 
      }
    } catch (error: any) {
      Alert.alert("Lỗi đăng nhập", "Tọa độ hoặc mật mã không chính xác!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* KeyboardAvoidingView giúp đẩy input lên khi bàn phím hiện ra */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. KHU VỰC ICON & TIÊU ĐỀ */}
          <View style={styles.headerSection}>
            <Ionicons name="planet" size={50} color="#FFFFFF" style={styles.brandIcon} />
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Kết nối tần số của bạn để khám phá vũ trụ</Text>
          </View>

          {/* 2. KHU VỰC FORM NHẬP LIỆU */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email hoặc Tên tài khoản"
                placeholderTextColor="#606A7B"
                value={identity}
                onChangeText={setIdentity}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="#606A7B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#A0AEC0" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.linkTextSmall}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {/* 3. NÚT BẤM CHÍNH & CHUYỂN MÀN */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Đăng Nhập</Text>
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <Text style={styles.normalText}>Chưa có phi thuyền?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.linkTextBold}> Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    
  );
}


// ==========================================
// ĐỊNH DẠNG (STYLES) ĐỒNG BỘ NỀN TỐI
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1128', // Nền xanh navy tối đồng bộ
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 30,
    justifyContent: 'space-around', // Rải đều nội dung
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  brandIcon: {
    marginBottom: 20,
    // Hiệu ứng phát sáng nhẹ cho icon thương hiệu
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Nền input mờ
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 58,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF', // Chữ trắng
    fontSize: 16,
    height: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 10,
  },
  actionSection: {
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: '#4361EE', // Nút xanh lam đồng bộ
    width: '100%',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    // Đổ bóng cho nút nổi bật
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  normalText: {
    color: '#A0AEC0',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  linkTextSmall: {
    color: '#D1D5DB',
    fontSize: 14,
  },
});