import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Thay bằng URL ngrok mới nhất của bạn
const BASE_URL = 'https://galaxyvibes-api.onrender.com/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'  // Thêm dòng này
    }
});

// Tự động gắn token
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Xử lý lỗi 401
api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            await AsyncStorage.multiRemove(['userToken', 'userId', 'userRole']);
            // Nếu có router thì redirect về login
        }
        return Promise.reject(error);
    }
);

export default api;