const Dotenv = require("dotenv-webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin"); // Импортируем CopyWebpackPlugin

module.exports = {
  mode: "development", // или "production"
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/",
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, ".env"), // Указываем путь к файлу .env
      systemvars: true, // Добавляем systemvars: true, чтобы загружать системные переменные окружения
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "_redirects"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }), // Добавляем плагин для копирования файла _redirects
  ],
  devtool: false, // Отключаем карты исходного кода
};
