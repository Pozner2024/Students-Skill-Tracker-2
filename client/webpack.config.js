const Dotenv = require("dotenv-webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/",
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, ".env"),
      systemvars: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "_redirects"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
  ],
  devtool: false,
};
