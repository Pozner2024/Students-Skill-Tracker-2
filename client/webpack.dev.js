const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

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

      devServer.app.use((req, res, next) => {
        const faviconPattern =
          /^\/(favicon\.ico|apple-touch-icon\.png|favicon-\d+x\d+\.png|android-chrome-\d+x\d+\.png|site\.webmanifest)$/;
        if (faviconPattern.test(req.path)) {
          const filePath = path.join(publicPath, req.path);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const contentTypeMap = {
              ".ico": "image/x-icon",
              ".png": "image/png",
              ".webmanifest": "application/manifest+json",
            };
            const contentType =
              contentTypeMap[ext] || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "no-cache");
            return res.sendFile(filePath);
          }
        }
        next();
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
      systemvars: true,
      path: "./.env",
      safe: false,
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
            ignore: ["**/about.txt"],
          },
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};
