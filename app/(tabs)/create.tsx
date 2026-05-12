import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../services/api';

export default function CreateStarScreen() {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  // Hàm chọn nhiều ảnh từ thư viện
  const pickImages = async () => {
    // Xin quyền truy cập thư viện ảnh
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Quyền bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh.');
      return;
    }

    // Mở thư viện ảnh, cho phép chọn nhiều ảnh
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  // Xóa một ảnh đã chọn
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Thiếu nội dung', 'Hãy viết gì đó hoặc chọn ảnh trước khi phóng sao.');
      return;
    }

    const formData = new FormData();
    formData.append('Content', content || '');
    formData.append('SentimentColor', '#FFFFFF');
    formData.append('PositionX', Math.floor(Math.random() * 10));
    formData.append('PositionY', Math.floor(Math.random() * 10));
    formData.append('PositionZ', Math.floor(Math.random() * 10));

    // Thêm từng ảnh vào FormData
    images.forEach((img, index) => {
      formData.append('images', {
        uri: img.uri,
        name: `photo_${Date.now()}_${index}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    setLoading(true);
    try {
      await api.post('/Stars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Thành công', 'Vì sao đã được phóng lên dải ngân hà!');
      setContent('');
      setImages([]);
    } catch (error: any) {
      const serverMessage = error.response?.data?.message || error.message;
      Alert.alert('Lỗi', serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/nen3.png')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Gửi gắm tâm tình</Text>
            </View>

            {/* Ô nhập nội dung */}
            <View style={styles.glassInputBox}>
              <TextInput
                style={styles.input}
                placeholder="Hãy để vũ trụ lắng nghe bạn..."
                placeholderTextColor="#606A7B"
                multiline
                value={content}
                onChangeText={setContent}
              />
            </View>

            {/* Khu vực chọn và hiển thị ảnh */}
            <View style={styles.imageSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                  <Ionicons name="add" size={36} color="#A0AEC0" />
                  <Text style={styles.addImageText}>Thêm ảnh</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Thanh công cụ và nút đăng */}
            <View style={styles.toolBar}>
              <TouchableOpacity style={styles.iconBtn} onPress={pickImages}>
                <Ionicons name="image-outline" size={24} color="#A0AEC0" />
                <Text style={styles.iconText}>Đính kèm ảnh</Text>
              </TouchableOpacity>
              <Text style={styles.countText}>{content.length}/500</Text>
            </View>

            <TouchableOpacity
              style={[styles.postBtn, { opacity: loading ? 0.6 : 1 }]}
              disabled={loading}
              onPress={handlePost}
            >
              <Text style={styles.postBtnText}>{loading ? 'ĐANG PHÓNG...' : 'PHÓNG SAO'}</Text>
              {!loading && <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, backgroundColor: 'rgba(10, 17, 40, 0.7)' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  header: { paddingTop: 40, paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', textShadowColor: 'rgba(67, 97, 238, 0.8)', textShadowRadius: 10 },
  glassInputBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 160,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  input: { flex: 1, color: '#FFF', fontSize: 17, textAlignVertical: 'top' },
  imageSection: { marginTop: 10, marginBottom: 10 },
  imageList: { paddingHorizontal: 20 },
  imageWrapper: { position: 'relative', marginRight: 12, marginBottom: 8 },
  thumbnail: { width: 80, height: 80, borderRadius: 12 },
  removeButton: { position: 'absolute', top: -8, right: -8 },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: { color: '#A0AEC0', fontSize: 10, marginTop: 4 },
  toolBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  iconBtn: { flexDirection: 'row', alignItems: 'center' },
  iconText: { color: '#A0AEC0', marginLeft: 8, fontSize: 15 },
  countText: { color: '#606A7B', fontSize: 14 },
  postBtn: {
    backgroundColor: '#4361EE',
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: '#4361EE', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5,
  },
  postBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1.5 },
});