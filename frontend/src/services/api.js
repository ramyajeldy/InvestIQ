import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const api = axios.create({ 
  baseURL: BASE_URL,
  timeout: 60000
})

// Chat
export const askQuestion = async (question) => {
  const res = await api.post('/chat', { question })
  return res.data
}

// Alias for ChatPage
export const postChatQuestion = async (question) => {
  const res = await api.post('/chat', { question })
  return res.data
}

// Market data
export const getMarketSnapshot = async (window = '7d') => {
  const res = await api.get(`/market-snapshot?window=${window}`)
  return res.data
}

// Supported questions
export const getSupportedQuestions = async () => {
  const res = await api.get('/supported-questions')
  return res.data
}

// Alias for ChatPage
export const fetchSupportedQuestions = async () => {
  const res = await api.get('/supported-questions')
  return res.data
}

// Health
export const getHealth = async () => {
  const res = await api.get('/health')
  return res.data
}

// Alias for ComparePage and Dashboard
export const fetchMarketSnapshot = async (window = '7d') => {
  const res = await api.get(`/market-snapshot?window=${window}`)
  return res.data
}