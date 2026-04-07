import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 15000,
});

export async function fetchMarketSnapshot() {
  const response = await api.get("/market-snapshot");
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
