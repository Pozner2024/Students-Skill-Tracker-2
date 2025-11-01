const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin"); // Импортируем CopyWebpackPlugin

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, "src", "index.js"),
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "public"),
        publicPath: "/",
        watch: true,
        staticOptions: {
          // Не использовать index для статических файлов
          index: false,
        },
      },
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/",
        watch: true,
      },
    ],
    compress: true,
    port: 9000,
    hot: true,
    open: true,
    historyApiFallback: {
      disableDotRule: true,
      htmlAcceptHeaders: ["text/html"],
      // ВАЖНО: статические файлы должны обрабатываться через static ДО этого
    },
    watchFiles: {
      paths: ["public/**/*"],
      options: {
        usePolling: false,
      },
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      logging: "warn",
    },
    setupMiddlewares: (middlewares, devServer) => {
      const publicPath = path.join(__dirname, "public");
      const express = require("express");

      // Принудительно обрабатываем favicon и другие статические файлы
      // Добавляем в самое начало цепочки
      devServer.app.get(/^\/(favicon\.ico|apple-touch-icon\.png|favicon-\d+x\d+\.png|site\.webmanifest)$/, (req, res) => {
        const filePath = path.join(publicPath, req.path);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath);
          const contentType = {
            ".ico": "image/x-icon",
            ".png": "image/png",
            ".webmanifest": "application/manifest+json",
          }[ext] || "application/octet-stream";
          
          res.setHeader("Content-Type", contentType);
          return res.sendFile(filePath);
        }
        res.status(404).send("Not found");
      });

      // Также добавляем express.static для всех файлов из public
      devServer.app.use(express.static(publicPath));

      // Handle source map requests gracefully
      devServer.app.get("*.map", (req, res) => {
        res.status(404).send("Source map not found");
      });

      return middlewares;
    },
  },
  devtool: "eval-cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    new Dotenv({
      systemvars: true, // Включаем доступ к системным переменным окружения
      path: "./.env", // Путь к файлу .env
      safe: false, // Не требовать .env.example
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "_redirects"),
          to: path.resolve(__dirname, "dist"),
        },
        {
          from: path.resolve(__dirname, "public"),
          to: path.resolve(__dirname, "dist"),
          toType: "dir",
          globOptions: {
            ignore: ["**/about.txt"], // Игнорируем ненужные файлы
          },
          noErrorOnMissing: true, // Не выдавать ошибку, если папка не существует
        },
      ],
    }), // Добавляем плагин CopyWebpackPlugin для копирования файла _redirects и статических файлов из public
  ],
};
