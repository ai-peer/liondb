const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
//const { dependencies } = require("../package.json");
let whiteListedModules = [];


module.exports = {
  //devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          "ts-loader",
        ],
        exclude: /node_modules/,
      },
    ],
  },
  //externals: [...Object.keys(dependencies || {}).filter((d) => !whiteListedModules.includes(d))],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  node: {
    console: true,
    fs: "empty",
    path: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty",
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new CleanWebpackPlugin(),
/*     new webpack.DefinePlugin({
      //"process.env.completed": 'true',
    }), */
  ],
  optimization: {
    //minimize: true,
    minimize: true,
    splitChunks: {
      /*       cacheGroups: {
        default: {
          name: "common",
          chunks: "all",
          minChunks: 1, //模块被引用1次以上的才抽离
          priority: -20,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
          minChunks: 1, //模块被引用1次以上的才抽离
          priority: -10,
        }, 
      }, */
    },
  },
};
