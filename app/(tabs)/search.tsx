import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const screenWidth = Dimensions.get('window').width;

  const fetchResults = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/Stars/search', { params: { q: query } });
      setResults(res.data || []);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(keyword);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword]);

  const clearSearch = () => {
    setKeyword('');
    setResults([]);
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={styles.glassCard}>
      <View style={styles.cardHeaderRow}>
        <Image
          source={{
            uri: item.user?.avatarUrl
              ? item.user.avatarUrl.startsWith('http')
                ? item.user.avatarUrl
                : `${BASE_MEDIA_URL}${item.user.avatarUrl}`
              : `https://i.pravatar.cc/150?u=${item.user?.username || 'user'}`,
          }}
          style={styles.postAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.user?.username || 'Vô danh'}</Text>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      {item.imageUrl ? (
        <View style={styles.imageSection}>
          {(() => {
            const urls = item.imageUrl.split(',').map((url: string) =>
              url.startsWith('http') ? url : `${BASE_MEDIA_URL}${url}`
            );
            if (urls.length === 1) {
              return (
                <AutoHeightImage
                  uri={urls[0]}
                  maxWidth={screenWidth * 0.7}
                  maxHeight={280}
                  style={styles.singleImage}
                />
              );
            } else {
              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.multiImageContainer}
                >
                  {urls.map((uri: string, idx: number) => (
                    <AutoHeightImage
                      key={idx}
                      uri={uri}
                      fixedWidth={180}
                      maxHeight={220}
                      style={styles.multiImage}
                    />
                  ))}
                </ScrollView>
              );
            }
          })()}
        </View>
      ) : null}

      <View style={styles.interactionBar}>
        <TouchableOpacity style={styles.interactionButton}>
          <Ionicons
            name={item.isLikedByMe ? "star" : "star-outline"}
            size={20}
            color={item.isLikedByMe ? "#F59E0B" : "#A0AEC0"}
          />
          <Text style={styles.interactionText}>{item.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#A0AEC0" />
          <Text style={styles.interactionText}>{item.commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/nen5.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tìm kiếm</Text>
            <Text style={styles.headerSubtitle}>Quét tìm vì sao trong dải ngân hà</Text>
          </View>

          {/* Thanh tìm kiếm */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={22} color="#4361EE" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm nội dung vì sao hoặc tên..."
                placeholderTextColor="#606A7B"
                value={keyword}
                onChangeText={setKeyword}
                autoFocus={true}
              />
              {keyword.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearIcon}>
                  <Ionicons name="close-circle" size={20} color="#606A7B" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Kết quả */}
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#4361EE" />
                <Text style={styles.loadingText}>Đang quét tín hiệu...</Text>
              </View>
            ) : keyword.trim() === '' ? (
              <View style={styles.centerContent}>
                <Ionicons name="planet-outline" size={80} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>Nhập từ khóa để quét dải ngân hà...</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.centerContent}>
                <Ionicons name="telescope-outline" size={80} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>Không tìm thấy tín hiệu nào phù hợp.</Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                renderItem={renderSearchResult}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* ==== THAY ẢNH BẰNG VIEW MÀU ĐỎ ĐỂ TEST VỊ TRÍ ==== */}
        {/* <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            backgroundColor: 'red',
            zIndex: 999,
            opacity: 0.8,
          }}
        /> */}
        {/* Nếu bạn muốn thử lại ảnh, comment view trên và bỏ comment dưới */}
        <Image
          source={require('../../assets/images/nen10s.png')}
          style={{
            position: 'absolute',
            bottom: -25,
            left: 100,
            right: 0,
            height: 440,
            zIndex: 999,
            opacity: 1,
          }}
          resizeMode="contain"
        />
        {/* ============================================= */}
      </View>
    </ImageBackground>
  );
}

// Styles giữ nguyên như cũ (bạn copy từ file cũ)
const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(10, 17, 40, 0.75)' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  headerSubtitle: { color: '#4361EE', fontSize: 14, marginTop: 2, fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.5)',
    paddingHorizontal: 15,
    height: 55,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, height: '100%' },
  clearIcon: { padding: 5 },
  resultsContainer: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: -50 },
  loadingText: { color: '#D1D5DB', marginTop: 15, fontSize: 16 },
  emptyText: { color: '#606A7B', fontSize: 16, marginTop: 20, textAlign: 'center', fontStyle: 'italic' },
  listContent: { padding: 20, paddingBottom: 120 },
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  timeText: { color: '#8F9BB3', fontSize: 12, marginTop: 3 },
  content: { color: '#F9FAFB', fontSize: 15, lineHeight: 24, marginBottom: 8 },
  imageSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  singleImage: {
    borderRadius: 12,
    maxHeight: 280,
    overflow: 'hidden',
  },
  multiImageContainer: {
    paddingRight: 40,
  },
  multiImage: {
    borderRadius: 12,
    marginRight: 8,
    maxHeight: 220,
    overflow: 'hidden',
  },
  interactionBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 15, marginTop: 5 },
  interactionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  interactionText: { color: '#A0AEC0', marginLeft: 8, fontSize: 15 },
});