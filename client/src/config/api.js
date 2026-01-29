// API Configuration
// Webpack настроен для загрузки .env файла через dotenv-webpack
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || "/api",
  ENDPOINTS: {
    TESTS: "/tests",
    TEST_BY_CODE: "/tests/test",
    TEST_WITH_IMAGES: "/tests/test-with-images",
    TEST_BY_ID: "/tests",
    IMAGES: "/images",
    AUTH: {
      REGISTER: "/auth/register",
      LOGIN: "/auth/login",
    },
    USERS: {
      PROFILE: "/users/profile",
    },
    TEST_RESULTS: {
      GET: "/test-results",
      SAVE: "/test-results",
    },
    TOPICS: "/topics",
    TOPIC_CONTENT: "/topics",
    UPLOAD: {
      UPLOAD: "/upload",
      FILES: "/upload/files",
      DELETE: "/upload/delete",
      DOWNLOAD: "/upload/download",
    },
  },
};

export default API_CONFIG;
