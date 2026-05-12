import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF', 
        tabBarInactiveTintColor: '#4B5563', 
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* 1. TAB TRANG CHỦ */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={28} color={color} />
          ),
        }}
      />

      {/* 2. TAB TÌM KIẾM (MỚI THÊM VÀO ĐỂ CÂN ĐỐI) */}
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={28} color={color} />
          ),
        }}
      />

      {/* 3. TAB TẠO BÀI VIẾT (Đã được đẩy ra chính giữa) */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.createButtonContainer}>
              <View style={[styles.createButtonInner, focused && styles.createButtonActive]}>
                <Ionicons name="add" size={32} color={focused ? "#FFFFFF" : "#9CA3AF"} />
              </View>
            </View>
          ),
        }}
      />

      {/* 4. TAB THÔNG BÁO */}
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={28} color={color} />
          ),
        }}
      />

      {/* 5. TAB CÁ NHÂN */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#050505', 
    borderTopWidth: 0, 
    height: Platform.OS === 'android' ? 80 : 90, 
    paddingBottom: Platform.OS === 'android' ? 25 : 30, 
    paddingTop: 10,
    position: 'absolute', 
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
  },
  createButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
  },
  createButtonInner: {
    backgroundColor: '#1A1A1A', 
    width: 45,
    height: 45,
    borderRadius: 12, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  createButtonActive: {
    backgroundColor: '#4361EE', 
    borderColor: '#4361EE',
  }
});