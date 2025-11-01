// API Configuration
// Webpack настроен для загрузки .env файла через dotenv-webpack
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || "http://localhost:5000",
  ENDPOINTS: {
    TESTS: "/tests",
    TEST_BY_CODE: "/tests/test",
    TEST_WITH_IMAGES: "/tests/test-with-images",
    TEST_BY_ID: "/tests",
    IMAGES: "/images",
    AUTH: {
      REGISTER: "/auth/register",
      LOGIN: "/auth/login",
      PROFILE: "/auth/profile",
      TEST_RESULTS: "/auth/test-results",
      SAVE_TEST_RESULT: "/auth/test-results",
    },
  },
};

export default API_CONFIG;
