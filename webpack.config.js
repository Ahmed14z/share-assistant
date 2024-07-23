const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    popup: "./src/popup.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [new Dotenv()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
      os: false,
    },
  },
  mode: "development",
  devtool: "source-map", // Change this from "eval" to "source-map"
};
