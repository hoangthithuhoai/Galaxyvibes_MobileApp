import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  // State quản lý form (khớp với DTO backend)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State ẩn/hiện mật khẩu
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Hàm xử lý đăng ký tạm thời
  const handleRegister = async () => {
    console.log("BƯỚC 1: Nút Đăng ký đã được bấm!");
    
    if (!username || !email || !password) {
      Alert.alert("Lỗi", "Vui lòng điền đủ thông tin.");
      return;
    }

    try {
      console.log("BƯỚC 2: Bắt đầu phóng tín hiệu sang Backend...");
      
      const response = await api.post('/Auth/register', {
        username: username,
        email: email,
        password: password
      });

      // In ra chính xác Backend trả lời cái gì
      console.log("BƯỚC 3: Backend đã phản hồi! Mã trạng thái:", response.status);

      // Chấp nhận mọi mã thành công (200, 201, 204...)
      if (response.status >= 200 && response.status < 300) {
        Alert.alert("Thành công", "Ghi danh vào dải ngân hà thành công!");
        router.push('/login');
      } else {
        Alert.alert("Thông báo", "Server phản hồi mã: " + response.status);
      }
      
    } catch (error: any) {
      console.log("BƯỚC 3: XẢY RA LỖI TẠI FRONTEND!");
      console.log("CHI TIẾT LỖI:", error.message);
      
      const backendError = error.response?.data?.message || JSON.stringify(error.response?.data?.errors);
      Alert.alert("Lỗi hệ thống", `Mã lỗi: ${error.message}\nTừ server: ${backendError || 'Không có'}`);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. NÚT BACK & TIÊU ĐỀ */}
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerTitleSection}>
            <Ionicons name="planet" size={50} color="#FFFFFF" style={styles.brandIcon} />
            <Text style={styles.title}>Tạo Tài Khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu hành trình khám phá dải ngân hà của riêng bạn</Text>
          </View>

          {/* 2. KHU VỰC FORM ĐĂNG KÝ */}
          <View style={styles.formSection}>
            {/* Tên tài khoản */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên tài khoản (vú dụ: star_gazer)"
                placeholderTextColor="#606A7B"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Địa chỉ Email"
                placeholderTextColor="#606A7B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Mật khẩu */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                placeholderTextColor="#606A7B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={20} color="#A0AEC0" />
              </TouchableOpacity>
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#606A7B"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPwd(!showConfirmPwd)}>
                <Ionicons name={showConfirmPwd ? "eye-off-outline" : "eye-outline"} size={20} color="#A0AEC0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. NÚT BẤM & ĐIỀU KHOẢN */}
          <View style={styles.actionSection}>
            <Text style={styles.termsText}>
              Bằng cách đăng ký, bạn đồng ý với các <Text style={styles.linkTextSmallBold}>Điều khoản dịch vụ</Text> của chúng tôi.
            </Text>

            <TouchableOpacity style={styles.mainButton} onPress={handleRegister}>
              <Text style={styles.buttonText}>Đăng Ký</Text>
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <Text style={styles.normalText}>Đã có phi thuyền?</Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.linkTextBold}> Đăng nhập</Text>
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
    backgroundColor: '#0a1128', // Nền navy tối
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  headerNav: {
    height: 50,
    justifyContent: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  headerTitleSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  brandIcon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  formSection: {
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56, // Thấp hơn login chút để vừa màn hình nhiều trường
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },
  actionSection: {
    alignItems: 'center',
  },
  termsText: {
    color: '#A0AEC0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  linkTextSmallBold: {
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  mainButton: {
    backgroundColor: '#4361EE', // Xanh lam đồng bộ
    width: '100%',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
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
});