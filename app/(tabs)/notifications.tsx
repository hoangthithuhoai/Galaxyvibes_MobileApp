import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../../services/api';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/Notifications')
      .then(res => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải thông báo:', err);
        setLoading(false);
      });
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    // Icon theo loại thông báo
    let iconName: keyof typeof Ionicons.glyphMap = 'notifications';
    let bgColor = 'rgba(255,255,255,0.05)';
    if (item.type === 'LIKE') {
      iconName = 'star';
      bgColor = 'rgba(67, 97, 238, 0.2)';
    } else if (item.type === 'COMMENT') {
      iconName = 'chatbubble';
      bgColor = 'rgba(0, 191, 255, 0.2)';
    } else if (item.type === 'FOLLOW') {
      iconName = 'person';
      bgColor = 'rgba(245, 158, 11, 0.2)';
    }

    return (
      <TouchableOpacity style={styles.glassNoti}>
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={20} color="#4361EE" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.notiText} numberOfLines={2}>
            <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
              {item.actor?.username || 'Ai đó'}{' '}
            </Text>
            <Text style={{ color: '#D1D5DB' }}>{item.message}</Text>
          </Text>
          <Text style={styles.time}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={require('../../assets/images/nen2.png')} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <Text style={styles.headerSub}>Trạm radar thông báo tần số</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#4361EE" style={{ marginTop: 50 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="planet-outline" size={60} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(10, 17, 40, 0.75)' },
  header: { paddingTop: 45, paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  headerSub: { color: '#4361EE', fontWeight: 'bold', letterSpacing: 2, marginTop: 5, fontSize: 12, textTransform: 'uppercase' },
  glassNoti: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notiText: { fontSize: 15, lineHeight: 20 },
  time: { color: '#606A7B', fontSize: 12, marginTop: 5 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#606A7B',
    fontSize: 15,
    marginTop: 15,
  },
});