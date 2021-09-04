// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
//const HtmlWebpackPlugin = require("html-webpack-plugin");
//const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
//const { VueLoaderPlugin } = require("vue-loader");
const isProduction = process.env.NODE_ENV == "production";
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const stylesHandler = "style-loader";
const TerserPlugin = require("terser-webpack-plugin");

const config = {
   entry: {
      browser: {
         import: "./src/index.ts",
         filename: "[name].js",
         library: {
            // all options under `output.library` can be used here
            name: "LionDB",
            type: "var",
            umdNamedDefine: false,
         },
      },
   },
   output: {
      path: path.resolve(__dirname, "dist"),
      /*       chunkFormat: "commonjs",
      libraryTarget: "commonjs",
      globalObject: 'this',, */
      library: {
         type: "commonjs2",
         umdNamedDefine: true,
      },
   },
   target: "web",
   externals: {
      crypto: "crypto",
      fs: "fs",
      os: "os",
      path: "path",
   },
   devServer: {
      open: false,
      host: "localhost",
      port: 9000,
   },
   module: {
      rules: [
         {
            test: /\.(ts|tsx)$/i,
            loader: "ts-loader",
            exclude: ["/node_modules/"],
         },
         /*          {
            test: /\.less$/i,
            use: [stylesHandler, "css-loader", "postcss-loader", "less-loader"],
         },
         {
            test: /\.css$/i,
            use: [stylesHandler, "css-loader", "postcss-loader"],
         },
         {
            test: /\.vue$/i,
            use: ["vue-loader"],
         },
         {
            test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
            type: "asset",
         }, */

         // Add your rules for custom modules here
         // Learn more about loaders from https://webpack.js.org/loaders/
      ],
   },
   resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
         // 配置目录别名，来确保模块引入变得更简单
         // 在任意目录下require('components/example') 相当于require('项目根目录/src/components/example')
         //components: path.join(root, 'src/components'),
         //views: path.join(root, 'src/views'),
         //styles: path.join(root, 'src/styles'),
         //store: path.join(root, 'src/store')
      },
      fallback: {
         //自定义require的模块 如 require("os") 等
         assert: require.resolve("assert"),
         util: require.resolve("util"),
         //path: require.resolve("path-browserify"),
      },
   },
   node: {
      global: true,
      __filename: false,
      __dirname: false,
   },
   plugins: [
      // 目标为 nodejs 环境使用
      new webpack.ProvidePlugin({
         Buffer: ["buffer", "Buffer"],
         process: "process/browser",
      }),

      /*       new HtmlWebpackPlugin({
         template: "index.html",
      }), */
      // 添加VueLoaderPlugin，以响应vue-loader
      //new VueLoaderPlugin(),
      // Add your plugins here
      // Learn more about plugins from https://webpack.js.org/configuration/plugins/
      new webpack.BannerPlugin({
         banner: `/*! https://github.com/ai-lion/liondb */`,
         raw: true,
      }),
      /*       new webpack.BannerPlugin({
         banner: "#!/usr/bin/env node",
         raw: true,
         include: [/lib/], //包含哪些文件需要添加头部
      }), */
      /*       new CopyPlugin({
         patterns: [{ from: path.resolve("libs/prebuilds"), to: "prebuilds" }],
      }), */
   ],
   optimization: {
      minimize: isProduction ? true : false,
      minimizer: [
         new TerserPlugin({
            extractComments: false, //不将注释提取到单独的文件中
         }),
      ],
   },
};

module.exports = () => {
   if (isProduction) {
      config.mode = "production";

      //config.plugins.push(new WorkboxWebpackPlugin.GenerateSW());
   } else {
      config.mode = "development";
   }
   return config;
};
