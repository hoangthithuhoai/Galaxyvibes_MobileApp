import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Universe3D from '../../components/Universe3D';
import api from '../../services/api';

// Ảnh nền
const FLOATING_IMG_PNG = require('../../assets/images/nen7.png');
const FLOATING_IMG_8_PNG = require('../../assets/images/nen8.png');
const ABC_LOGO = require('../../assets/images/abc.png');

const BASE_MEDIA_URL = 'https://galaxyvibes-api.onrender.com';

// ---------- Ảnh tự động tỉ lệ ----------
const AutoHeightImage = ({
  uri,
  maxWidth,
  maxHeight = 280, 
  fixedWidth,
  style,
}: {
  uri: string;
  maxWidth?: number | string;
  fixedWidth?: number;
  maxHeight?: number;
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
  return (
    <Image
      source={{ uri }}
      style={[computedStyle, style]}
      resizeMode="cover"
    />
  );
};

// ---------- Component chính ----------
export default function HomeScreen() {
  const [stars, setStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Comment states
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedStar, setSelectedStar] = useState<any>(null);
  const screenWidth = Dimensions.get('window').width;

  // Gọi API lấy danh sách stars
  const fetchStars = async (pageNumber: number, isRefresh = false) => {
    try {
      const res = await api.get('/Stars', {
        params: { page: pageNumber, pageSize: 10 },
      });
      const { items, totalPages, currentPage } = res.data;
      const newStars = items || [];
      if (currentPage >= totalPages) setHasMore(false);
      if (isRefresh) {
        setStars(newStars);
      } else {
        setStars(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const uniqueNewStars = newStars.filter((s: any) => !existingIds.has(s.id));
          return [...prev, ...uniqueNewStars];
        });
      }
    } catch (err) {
      console.error('Lỗi tải stars:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
  useCallback(() => {
    fetchStars(1, true);
  }, [])
);

useEffect(() => {
  const getUserId = async () => {
    const userIdStr = await AsyncStorage.getItem('userId');
    if (userIdStr) {
      setCurrentUserId(parseInt(userIdStr));
    }
  };
  getUserId();
}, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchStars(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchStars(nextPage);
    }
  };

  // Like / Unlike
  const handleLike = async (starId: number) => {
    try {
      const res = await api.post(`/Likes/${starId}`);
      const { likeCount, isLiked } = res.data;
      setStars(prev =>
        prev.map(s =>
          s.id === starId ? { ...s, likeCount, isLikedByMe: isLiked } : s
        )
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể thực hiện');
    }
  };

  // Save / Unsave
  const handleSave = async (starId: number) => {
    try {
      const res = await api.post(`/Saves/${starId}`);
      const { isSaved } = res.data;
      setStars(prev =>
        prev.map(s =>
          s.id === starId ? { ...s, isSavedByMe: isSaved } : s
        )
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể lưu');
    }
  };

  const handleDeleteStar = (starId: number) => {
  Alert.alert(
    'Xóa bài viết',
    'Bạn có chắc muốn xóa bài viết này?',
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/Stars/${starId}`);
            // Xóa bài viết khỏi state hiện tại
            setStars(prev => prev.filter(s => s.id !== starId));
          } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa');
          }
        },
      },
    ]
  );
};

  // Lấy danh sách comment
  const fetchComments = async (starId: number) => {
    setLoadingComments(prev => ({ ...prev, [starId]: true }));
    try {
      const res = await api.get(`/Comments/${starId}`);
      setCommentsData(prev => ({ ...prev, [starId]: res.data }));
    } catch (err) {
      console.error('Lỗi tải comment:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [starId]: false }));
    }
  };

  // Gửi comment mới
  const handleAddComment = async (starId: number) => {
    const content = commentInputs[starId]?.trim();
    if (!content) return;

    try {
      await api.post(`/Comments/${starId}`, { content });
      setCommentInputs(prev => ({ ...prev, [starId]: '' }));
      fetchComments(starId);
      setStars(prev =>
        prev.map(s =>
          s.id === starId ? { ...s, commentCount: s.commentCount + 1 } : s
        )
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi bình luận');
    }
  };

  // Bật/tắt hiển thị comment
  const toggleComments = (starId: number) => {
    setExpandedComments(prev => {
      const isCurrentlyExpanded = !!prev[starId];
      if (!isCurrentlyExpanded) {
        fetchComments(starId);
      }
      return { ...prev, [starId]: !isCurrentlyExpanded };
    });
  };

  // Render mỗi bài viết
  const renderStarCard = ({ item }: { item: any }) => (
    <View style={styles.flatCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={{
                uri: item.user?.avatarUrl
                ? item.user.avatarUrl.startsWith('http')
                ? item.user.avatarUrl
                : `${BASE_MEDIA_URL}${item.user.avatarUrl}`
                : `https://i.pravatar.cc/150?u=${item.user?.username || 'vô_danh'}`,
            }}
            style={styles.postAvatar}
            />
          <View style={styles.headerTextContainer}>
            <View style={styles.nameTimeRow}>
              <Text style={styles.username}>{item.user?.username || 'Vô danh'}</Text>
              <Text style={styles.dotSeparator}> • </Text>
              <Text style={styles.timeText}>
                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
        </View>
        {currentUserId === item.userId && (
  <TouchableOpacity
    style={styles.moreButton}
    onPress={() => handleDeleteStar(item.id)}
  >
    <Ionicons name="ellipsis-horizontal" size={18} color="#A0AEC0" />
  </TouchableOpacity>
)}
      </View>

      {/* Nội dung */}
      <Text style={styles.content}>{item.content}</Text>

      {/* Ảnh (nếu có) */}
{item.imageUrl ? (
  <View style={styles.imageSection}>
    {(() => {
      const urls = item.imageUrl.split(',').map((url: string) =>
        url.startsWith('http') ? url : `${BASE_MEDIA_URL}${url}`
      );
      if (urls.length === 1) {
        // Một ảnh: rộng 85% màn hình, maxHeight 350, overflow hidden để cắt bớt
        return (
          <TouchableOpacity onPress={() => setSelectedImageUri(urls[0])}>
            <AutoHeightImage
              uri={urls[0]}
              maxWidth={Math.min(screenWidth * 0.7, 350)}
              maxHeight={300}
              style={styles.singleImage}
            />
          </TouchableOpacity>
        );
      } else {
        // Nhiều ảnh: hàng ngang cuộn được, mỗi ảnh rộng 200, maxHeight 300
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
                  fixedWidth={200}
                  maxHeight={280}
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

      {/* Thanh tương tác */}
      <View style={styles.interactionBar}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.isLikedByMe ? 'star' : 'star-outline'}
            size={20}
            color={item.isLikedByMe ? '#F59E0B' : '#A0AEC0'}
          />
          <Text style={[styles.interactionText, item.isLikedByMe && { color: '#F59E0B', fontWeight: 'bold' }]}>
            {item.likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => toggleComments(item.id)}
        >
          <Ionicons
            name={expandedComments[item.id] ? 'chatbubble' : 'chatbubble-outline'}
            size={18}
            color={expandedComments[item.id] ? '#4361EE' : '#A0AEC0'}
          />
          <Text style={styles.interactionText}>{item.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave(item.id)}
        >
          <Ionicons
            name={item.isSavedByMe ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={item.isSavedByMe ? '#4361EE' : '#A0AEC0'}
          />
        </TouchableOpacity>
      </View>

      {/* Khu vực comment */}
      {expandedComments[item.id] && (
        <View style={styles.commentsSection}>
          {loadingComments[item.id] ? (
            <ActivityIndicator size="small" color="#4361EE" style={{ marginVertical: 10 }} />
          ) : (
            <>
              {commentsData[item.id]?.map((comment: any) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image
                    source={{ uri: `https://i.pravatar.cc/150?u=${comment.user?.username || 'user'}` }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentUsername}>{comment.user?.username || 'Ẩn danh'}</Text>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Viết bình luận..."
                  placeholderTextColor="#606A7B"
                  value={commentInputs[item.id] || ''}
                  onChangeText={(text) =>
                    setCommentInputs(prev => ({ ...prev, [item.id]: text }))
                  }
                  onSubmitEditing={() => handleAddComment(item.id)}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleAddComment(item.id)}
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.backgroundContainer}>
        {/* Header với ảnh nền và logo */}
        <View style={styles.headerAreaContainer}>
          <View style={styles.floatingWrapper}>
            <Image source={FLOATING_IMG_PNG} style={[styles.floatingHeaderImage, { tintColor: 'rgba(255, 218, 224, 0.95)' }]} resizeMode="contain" />
            <Image source={FLOATING_IMG_PNG} style={[styles.floatingHeaderImage, { position: 'absolute', opacity: 0.65 }]} resizeMode="contain" />
          </View>
          <View style={styles.floatingWrapper8}>
            <Image source={FLOATING_IMG_8_PNG} style={styles.floatingHeaderImage} resizeMode="contain" />
          </View>

          <View style={styles.headerContents}>
            <View style={styles.logoTitleContainer}>
              <Image source={ABC_LOGO} style={styles.mainLogo} />
              <Text style={styles.headerTitle}>
                Galaxy<Text style={styles.vibesText}>vibes</Text>
              </Text>
            </View>
          </View>

          <View style={styles.toggleWrapper}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !is3DMode && styles.toggleButtonActive]}
                onPress={() => setIs3DMode(false)}
              >
                <Ionicons name="list" size={18} color={!is3DMode ? "#FFFFFF" : "#8F9BB3"} style={styles.toggleIcon} />
                <Text style={[styles.toggleText, !is3DMode && styles.toggleTextActive]}>Bảng tin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, is3DMode && styles.toggleButtonActive]}
                onPress={() => setIs3DMode(true)}
              >
                <Ionicons name="cube" size={18} color={is3DMode ? "#FFFFFF" : "#8F9BB3"} style={styles.toggleIcon} />
                <Text style={[styles.toggleText, is3DMode && styles.toggleTextActive]}>Vũ trụ 3D</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.contentBody}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4361EE" />
              <Text style={styles.loadingText}>Đang đồng bộ tần số...</Text>
            </View>
          ) : is3DMode ? (
              <Universe3D
                  stars={stars}
                  onStarPress={(star) => setSelectedStar(star)}
              />
          ) : (
            <FlatList
              data={stars}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderStarCard}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#4361EE" /> : null}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Modal xem ảnh full */}
      {selectedImageUri && (
        <Modal
          visible={!!selectedImageUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImageUri(null)}
        >
          <View style={styles.modalOverlay}>
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
          {/* Modal xem chi tiết sao */}
{selectedStar && (
  <Modal
    visible={!!selectedStar}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setSelectedStar(null)}
  >
    <View style={styles.starDetailOverlay}>
      <TouchableOpacity
        style={styles.modalCloseButton}
        onPress={() => setSelectedStar(null)}
      >
        <Ionicons name="close" size={30} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.starDetailCard}>
        <Text style={styles.starDetailText}>{selectedStar.content}</Text>
        {/* Có thể thêm ảnh nếu có imageUrl */}
      </View>
    </View>
  </Modal>
)}
      
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  backgroundContainer: { flex: 1, backgroundColor: '#0a1128' },
  headerAreaContainer: { paddingVertical: 10, position: 'relative' },
  floatingWrapper: {
    position: 'absolute', width: 160, height: 350, right: 0, top: -170, zIndex: 10,
    shadowColor: '#FFC0CB', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 8,
  },
  floatingWrapper8: {
    position: 'absolute', width: 72, height: 67, right: 145, top: 35, zIndex: 10,
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  floatingHeaderImage: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  headerContents: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, zIndex: 20, elevation: 10 },
  logoTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  mainLogo: { width: 32, height: 32, marginRight: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.5 },
  vibesText: { color: '#00BFFF' },
  toggleWrapper: { paddingHorizontal: 20, marginBottom: 5, marginTop: 10, zIndex: 20, elevation: 10 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#121933', borderRadius: 25, padding: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  toggleButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  toggleButtonActive: { backgroundColor: '#4361EE' },
  toggleIcon: { marginRight: 6 },
  toggleText: { color: '#8F9BB3', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  contentBody: { flex: 1 },
  threeDContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  threeDTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 20, marginBottom: 10 },
  threeDDesc: { color: '#A0AEC0', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  listContent: { paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#D1D5DB', marginTop: 15, fontSize: 16 },
  flatCard: { backgroundColor: 'transparent', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 30, height: 30, borderRadius: 15 },
  headerTextContainer: { marginLeft: 10 },
  nameTimeRow: { flexDirection: 'row', alignItems: 'center' },
  username: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dotSeparator: { color: '#606A7B', fontSize: 14, marginHorizontal: 4 },
  timeText: { color: '#606A7B', fontSize: 13 },
  moreButton: { padding: 5, marginRight: -5 },
  content: { color: '#F9FAFB', fontSize: 15, lineHeight: 24, marginBottom: 6, marginLeft: 40 },

  // Ảnh
  imageSection: {
    marginTop: 6,
    marginLeft: 40,
    marginBottom: 8,
  },
  singleImage: {
    borderRadius: 12,
    maxHeight: 350,
  },
  multiImageContainer: {
    paddingRight: 40,
  },
  multiImage: {
    borderRadius: 12,
    marginRight: 8,
  },

  interactionBar: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginLeft: 40 },
  interactionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  interactionText: { color: '#A0AEC0', marginLeft: 6, fontSize: 14 },
  saveButton: { padding: 5, marginLeft: -5 },

  // Comment styles
  commentsSection: {
    marginTop: 10,
    marginLeft: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentBody: {
    flex: 1,
  },
  commentUsername: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commentContent: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#4361EE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },

  starDetailOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.8)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},
starDetailCard: {
  backgroundColor: '#1A1A2E',
  borderRadius: 20,
  padding: 30,
  width: '100%',
  maxHeight: '70%',
},
starDetailText: {
  color: '#FFF',
  fontSize: 18,
  lineHeight: 28,
  textAlign: 'center',
},
});