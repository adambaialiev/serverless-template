import axios from "axios";

const OPEN_AI_API_TOKEN = "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";

export const axiosInstance = axios.create({
  baseURL: "https://api.openai.com/",
  headers: {
    Authorization: `Bearer ${OPEN_AI_API_TOKEN}`,
    "OpenAI-Beta": "assistants=v1",
  },
});
