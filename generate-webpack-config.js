const fs = require("fs");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Function to generate entry points
const generateEntryPoints = (srcDir) => {
  const entries = {};
  const files = fs.readdirSync(srcDir);

  files.forEach((file) => {
    const extname = path.extname(file);
    if (extname === ".js") {
      const basename = path.basename(file, extname);
      entries[basename] = path.join(srcDir, file);
    }
  });

  return entries;
};

const srcDir = path.resolve(__dirname, "src");
const entryPoints = generateEntryPoints(srcDir);

// Webpack configuration
const webpackConfig = {
  entry: {
    background: "./src/background/Background.js",
    content: "./src/content/content.js",
    popup: "./src/popup.js",
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
    fallback: {
      fs: false,
      path: false,
      os: false,
    },
  },
  mode: "development",
  devtool: "source-map", // Change this from "eval" to "source-map"
  plugins: [
    new Dotenv(),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/popup.html", to: "popup.html" },
        { from: "icons", to: "icons" },
      ],
    }),
  ],
};

// Write the webpack configuration to a file
const webpackConfigPath = path.resolve(__dirname, "webpack.config.js");
const configString = `
const Dotenv = require('dotenv-webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: ${JSON.stringify(webpackConfig.entry, null, 2)},
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\\.js$/, // Ensure this is correctly formatted as a regex
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
  resolve: ${JSON.stringify(webpackConfig.resolve, null, 2)},
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
`;

fs.writeFileSync(webpackConfigPath, configString);

console.log("Webpack configuration generated successfully.");
