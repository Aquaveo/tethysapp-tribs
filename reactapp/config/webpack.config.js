const path = require("path");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const HtmlPlugin = require("html-webpack-plugin");
const HtmlTagsPlugin = require("html-webpack-tags-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = (env, argv) => {
  const dotEnvPath = `./reactapp/config/${argv.mode}.env`;
  console.log(`Building in ${argv.mode} mode...`);
  console.log(`=> Using .env config at "${dotEnvPath}"`);
  return {
    entry: ["./reactapp"],
    output: {
      path: path.resolve(__dirname, "../../tethysapp/tribs/public/project-editor"),
      filename: "[name].js",
      publicPath: "/static/tribs/project-editor/",
      clean: true,
    },
    resolve: {
      modules: [
        path.resolve(__dirname, "../"),
        path.resolve(__dirname, "../../node_modules"),
      ],
    },
    plugins: [
      new Dotenv({
        path: dotEnvPath,
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "node_modules/cesium/Build/Cesium",
            to: "cesium",
          },
        ],
      }),
      new HtmlPlugin({
        template: "tethysapp/tribs/templates/tribs/project_editor.html",
      }),
      new HtmlTagsPlugin({
        append: false,
        tags: ["cesium/Widgets/widgets.css", "cesium/Cesium.js"],
      }),
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify("/static/tribs/project-editor/cesium"),
      }),
      new NodePolyfillPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
            },
          ],
        },
        {
          test: /\.css$/,
          // exclude: /node_modules/,
          use: [ "style-loader", "css-loader" ],
        },
        {
          test: /\.(scss|sass)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
            {
              loader: "sass-loader",
            },
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg|mp4|mp3)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                outputPath: "",
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: true,
    },
    devServer: {
      proxy: {
        "/[A-Za-z0-9-/]+/ws/": {
          target: "ws://127.0.0.1:8000",
          ws: true,
        },
        "!/static/tribs/project-editor/**": {
          target: "http://127.0.0.1:8000", // points to django dev server
          changeOrigin: true,
        },
      },
      open: true,
    },
  };
};
