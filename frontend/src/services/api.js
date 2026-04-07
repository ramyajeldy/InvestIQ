import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  timeout: 15000,
});

export async function fetchMarketSnapshot(windowCode) {
  const response = await api.get("/market-snapshot", {
    params: windowCode ? { window: windowCode } : {},
  });
  return response.data;
}

export async function fetchSupportedQuestions() {
  const response = await api.get("/supported-questions");
  return response.data;
}

export async function postChatQuestion(question) {
  const response = await api.post("/chat", { question });
  return response.data;
}

export default api;
