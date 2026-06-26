import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

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
