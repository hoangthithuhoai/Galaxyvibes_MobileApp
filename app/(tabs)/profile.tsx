import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../services/api';

const BASE_MEDIA_URL = 'https://galaxyvibes-api.onrender.com'; 

// ---------- Component ảnh tự động tỉ lệ ----------
const AutoHeightImage = ({
  uri,
  maxWidth,
  maxHeight = 300,
  fixedWidth,
  style,
}: {
  uri: string;
  maxWidth?: number | string;
  maxHeight?: number;
  fixedWidth?: number;
  style?: any;
}) => {
  const [aspectRatio, setAspectRatio] = useState(1.5);
  useEffect(() => {
    if (uri) {
      Image.getSize(
        uri,
        (width, height) => {
          if (height > 0) setAspectRatio(width / height);
        },
        () => {}
      );
    }
  }, [uri]);

  let computedStyle: any = { aspectRatio, maxHeight };
  if (fixedWidth) {
    computedStyle.width = fixedWidth;
  } else {
    computedStyle.width = maxWidth ?? '100%';
  }
  return <Image source={{ uri }} style={[computedStyle, style]} resizeMode="cover" />;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'grid' | 'list' | 'saved'>('list');
  const [user, setUser] = useState<any>(null);
  const [myStars, setMyStars] = useState<any[]>([]);
  const [savedStars, setSavedStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;

  // Load profile & bài viết của tôi
  const loadProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const [profileRes, starsRes] = await Promise.all([
        api.get(`/Auth/profile/${userId}`),
        api.get(`/Stars/my-stars/${userId}`),
      ]);
      setUser(profileRes.data);
      setMyStars(starsRes.data);
    } catch (err) {
      console.error('Lỗi tải profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load bài viết đã lưu
  const loadSavedStars = async () => {
    try {
      const res = await api.get('/Saves/my-saved');
      setSavedStars(res.data);
    } catch (err) {
      console.error('Lỗi tải bài viết đã lưu:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      if (activeTab === 'saved') loadSavedStars();
    }, [activeTab])
  );

  // Đăng xuất
  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userId', 'userRole']);
          router.replace('/login');
        },
      },
    ]);
  };

  // Đổi ảnh đại diện
  const handleChangeAvatar = async () => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Quyền bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const userId = await AsyncStorage.getItem('userId');
      const formData = new FormData();
      formData.append('avatar', {
        uri: selectedAsset.uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await api.put(`/Auth/update-avatar/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Cập nhật state với avatarUrl mới, thêm timestamp để tránh cache
      const newAvatarUrl = res.data.avatarUrl;
      setUser((prev: any) => ({
        ...prev,
        avatarUrl: `${newAvatarUrl}?t=${Date.now()}`,
      }));

      Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật.');
    }
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Lỗi không xác định';
    Alert.alert('Lỗi', message);
  }
};

  // Xóa bài viết (chỉ cho bài của mình)
  const handleDeleteStar = (starId: number) => {
    Alert.alert(
      'Xóa bài viết',
      'Bạn có chắc muốn xóa vĩnh viễn bài viết này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/Stars/${starId}`);
              setMyStars(prev => prev.filter(s => s.id !== starId));
              setSavedStars(prev => prev.filter(s => s.id !== starId));
              Alert.alert('Thành công', 'Bài viết đã được xóa.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa bài viết');
            }
          },
        },
      ]
    );
  };

  // Bỏ lưu bài viết
  const handleUnsaveStar = async (starId: number) => {
    try {
      await api.post(`/Saves/${starId}`);
      // Sau khi bỏ lưu, cập nhật lại state
      setSavedStars(prev => prev.filter(s => s.id !== starId));
      Alert.alert('Thành công', 'Đã bỏ lưu bài viết.');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể bỏ lưu bài viết');
    }
  };

  // Hàm xử lý khi nhấn nút ba chấm
  const handleMorePress = (starId: number) => {
    if (activeTab === 'list') {
      // Tab bài viết của tôi -> Xóa
      handleDeleteStar(starId);
    } else if (activeTab === 'saved') {
      // Tab bài viết đã lưu -> Bỏ lưu
      Alert.alert(
        'Bỏ lưu bài viết',
        'Bạn có chắc muốn bỏ lưu bài viết này?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Bỏ lưu',
            onPress: () => handleUnsaveStar(starId),
          },
        ]
      );
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361EE" />
      </View>
    );
  }

  // Render phần header profile
  const renderProfileHeader = () => (
    <View style={styles.profileHeaderContainer}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ width: 30 }} />
        <Text style={styles.topUsername}>{user.username}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Avatar & Stats */}
      <View style={styles.statsRow}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={handleChangeAvatar}>
            <Image
              source={{
                uri: user.avatarUrl?.startsWith('http')
                  ? user.avatarUrl
                  : user.avatarUrl
                  ? `${BASE_MEDIA_URL}${user.avatarUrl}`
                  : `https://i.pravatar.cc/150?u=${user.username}`,
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraIconOverlay}>
              <Ionicons name="camera" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myStars.length}</Text>
            <Text style={styles.statLabel}>bài viết</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followersCount || 0}</Text>
            <Text style={styles.statLabel}>người theo dõi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followingCount || 0}</Text>
            <Text style={styles.statLabel}>đang theo dõi</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioContainer}>
        <Text style={styles.bioName}>{user.username}</Text>
        <TouchableOpacity>
          <Text style={styles.bioLink}>@{user.username}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.contentTabs}>
        <TouchableOpacity
          style={[styles.contentTab, activeTab === 'grid' && styles.activeContentTab]}
          onPress={() => setActiveTab('grid')}
        >
          <Ionicons name="grid-outline" size={24} color={activeTab === 'grid' ? '#4361EE' : '#606A7B'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contentTab, activeTab === 'list' && styles.activeContentTab]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons name="list-outline" size={26} color={activeTab === 'list' ? '#4361EE' : '#606A7B'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contentTab, activeTab === 'saved' && styles.activeContentTab]}
          onPress={() => {
            setActiveTab('saved');
            loadSavedStars();
          }}
        >
          <Ionicons name="bookmark-outline" size={24} color={activeTab === 'saved' ? '#4361EE' : '#606A7B'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render bài viết (dùng cho tab list và saved)
  const renderPost = ({ item }: { item: any }) => {
    // Sử dụng item.user (người viết bài) thay vì user (người đang xem profile)
    const author = item.user || {};
    return (
      <View style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Image
              source={{
                uri: author.avatarUrl?.startsWith('http')
                  ? author.avatarUrl
                  : author.avatarUrl
                  ? `${BASE_MEDIA_URL}${author.avatarUrl}`
                  : `https://i.pravatar.cc/150?u=${author.username || user.username}`,
              }}
              style={styles.postAvatar}
            />
            <View style={styles.headerTextContainer}>
              <View style={styles.nameTimeRow}>
                <Text style={styles.postUsername}>{author.username || user.username}</Text>
                <Text style={styles.dotSeparator}> • </Text>
                <Text style={styles.timeText}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
          {/* Sửa dấu ba chấm để gọi hàm tương ứng */}
          <TouchableOpacity style={styles.moreButton} onPress={() => handleMorePress(item.id)}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#A0AEC0" />
          </TouchableOpacity>
        </View>

        <Text style={styles.content}>{item.content}</Text>

        {/* Ảnh */}
        {item.imageUrl ? (
          <View style={styles.imageSection}>
            {(() => {
              const urls = item.imageUrl.split(',').map((url: string) =>
                url.startsWith('http') ? url : `${BASE_MEDIA_URL}${url}`
              );
              if (urls.length === 1) {
                return (
                  <TouchableOpacity onPress={() => setSelectedImageUri(urls[0])}>
                    <AutoHeightImage
                      uri={urls[0]}
                      maxWidth={screenWidth * 0.7}
                      maxHeight={280}
                      style={styles.singleImage}
                    />
                  </TouchableOpacity>
                );
              } else {
                return (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.multiImageContainer}
                  >
                    {urls.map((uri: string, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedImageUri(uri)}>
                        <AutoHeightImage
                          uri={uri}
                          fixedWidth={180}
                          maxHeight={220}
                          style={styles.multiImage}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                );
              }
            })()}
          </View>
        ) : null}

        <View style={styles.interactionBar}>
          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name={item.isLikedByMe ? "star" : "star-outline"} size={20} color={item.isLikedByMe ? "#F59E0B" : "#A0AEC0"} />
            <Text style={[styles.interactionText, item.isLikedByMe && { color: '#F59E0B', fontWeight: 'bold' }]}>{item.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton}>
            <Ionicons name="chatbubble-outline" size={18} color="#A0AEC0" />
            <Text style={styles.interactionText}>{item.commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render lưới ảnh (tab grid)
  const renderGrid = () => {
    const allImages: string[] = [];
    myStars.forEach(star => {
      if (star.imageUrl) {
        const urls = star.imageUrl.split(',').map((url: string) =>
          url.startsWith('http') ? url : `${BASE_MEDIA_URL}${url}`
        );
        allImages.push(...urls);
      }
    });

    if (allImages.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="image-outline" size={60} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={allImages}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridImageWrapper} onPress={() => setSelectedImageUri(item)}>
            <Image source={{ uri: item }} style={styles.gridImage} resizeMode="cover" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.gridContainer}
      />
    );
  };

  return (
    <ImageBackground source={require('../../assets/images/nen9.png')} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <FlatList
            data={activeTab === 'list' ? myStars : activeTab === 'saved' ? savedStars : []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPost}
            ListHeaderComponent={
              <>
                {renderProfileHeader()}
                {activeTab === 'grid' && renderGrid()}
              </>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </View>

      {/* Modal menu */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
              <Text style={[styles.menuText, { color: '#FF6B6B' }]}>Đăng xuất</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              <Text style={styles.menuText}>Cài đặt</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal xem ảnh full */}
      {selectedImageUri && (
        <Modal
          visible={!!selectedImageUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImageUri(null)}
        >
          <View style={styles.modalImageOverlay}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedImageUri(null)}
            >
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </ImageBackground>
  );
}

// Styles (giữ nguyên như file hiện tại của bạn)
const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 17, 40, 0.85)' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1128' },
  profileHeaderContainer: { paddingBottom: 10 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  topUsername: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
  avatarWrapper: {
    position: 'relative',
    marginRight: 30,
  },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 1, borderColor: '#4361EE' },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4361EE',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a1128',
  },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#F9FAFB', fontSize: 13, marginTop: 2 },
  bioContainer: { paddingHorizontal: 20, marginTop: 15 },
  bioName: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  bioLink: { color: '#4361EE', fontSize: 14, marginTop: 5, fontWeight: '500' },
  contentTabs: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  contentTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeContentTab: { borderTopWidth: 2, borderTopColor: '#4361EE', marginTop: -1 },
  listContent: { paddingBottom: 120 },
  glassCard: { backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerTextContainer: { marginLeft: 10 },
  nameTimeRow: { flexDirection: 'row', alignItems: 'center' },
  postUsername: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  dotSeparator: { color: '#606A7B', fontSize: 15 },
  timeText: { color: '#606A7B', fontSize: 13 },
  moreButton: { padding: 5 },
  content: { color: '#F9FAFB', fontSize: 15, lineHeight: 24, marginBottom: 6, marginLeft: 42 },
  imageSection: { marginTop: 6, marginLeft: 42, marginBottom: 8 },
  singleImage: { borderRadius: 12, maxHeight: 280, overflow: 'hidden' },
  multiImageContainer: { paddingRight: 40 },
  multiImage: { borderRadius: 12, marginRight: 8, maxHeight: 220, overflow: 'hidden' },
  interactionBar: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginLeft: 42 },
  interactionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  interactionText: { color: '#A0AEC0', marginLeft: 6, fontSize: 14 },
  gridContainer: { paddingHorizontal: 15, paddingTop: 15 },
  gridImageWrapper: { flex: 1 / 3, aspectRatio: 1, padding: 2 },
  gridImage: { width: '100%', height: '100%', borderRadius: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#606A7B', fontSize: 15, marginTop: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
  },
  menuContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingVertical: 8,
    width: 180,
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  menuText: { color: '#FFFFFF', fontSize: 16, marginLeft: 12 },
  modalImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseButton: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  modalImage: { width: '100%', height: '80%' },
});