import axios from 'axios'

// Ưu tiên VITE_API_URL; chạy local (npm run dev) dùng proxy /api; build production dùng Render
const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? '/api' : 'https://scct-backend-7vas.onrender.com/api')
const api = axios.create({ baseURL: API_URL })

// Tự động gắn token từ localStorage khi khởi động
const token = localStorage.getItem('scct_token')
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('scct_token')
      localStorage.removeItem('scct_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
