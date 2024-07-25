
const Dotenv = require('dotenv-webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
  "background": "./src/background/Background.js",
  "content": "./src/content/content.js",
  "popup": "./src/popup.js"
},
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Ensure this is correctly formatted as a regex
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
  "fallback": {
    "fs": false,
    "path": false,
    "os": false
  }
},
  mode: "development",
  devtool: "source-map", // Change this from "eval" to "source-map"
  plugins: [
    new Dotenv(),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/popup.html", to: "popup.html" },
        { from: "icons", to: "icons" }
      ]
    })
  ],
};
