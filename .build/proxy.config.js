const path = require("path");
const baseConfig = require("./proxy.base.config");
const merge = require("merge-deep");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require("fs");
const CopyToTargetPlugin = require("./plugs/copy-to-target");

module.exports = (env) => {
  return merge({}, baseConfig, {
    target: "node",
    output: {
      filename: "./[name].js",
      libraryTarget: "commonjs",
    },
    entry: {
      "mdproxy-server": path.resolve("bin/lsserver.ts"),
      "mdproxy-local": path.resolve("bin/lslocal.ts"),
      index: path.resolve("lib/index.ts"),
      //"proxy-relay": path.resolve("lib/arelay.ts"),
      //'proxy-node': path.resolve('src/proxy/single/proxy-node/index.ts'),
      //'proxy-client': path.resolve( 'src/proxy/single/proxy-client/index.ts'),
    },
    mode: "production",
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "prebuilds", to: "prebuilds" },
          { from: "index.d.ts", to: "../../light-proxy-net" },
        ],
      }),
      new CopyToTargetPlugin({
        patterns: [
          { from: path.resolve('dist/index.js'), to: path.resolve("../light-proxy-net/index.js")},
        ],
      }),
    ],
  });
};

/* if (fs.existsSync(fromfile)) {
   fs.watchFile(fromfile, (curr, prev) => {
    try {
      fs.createReadStream(fromfile).pipe(fs.createWriteStream(tofile));
    } catch (err) {
    } finally {
      fs.unwatchFile(fromfile);
    }
  }); 
} else {
  setTimeout(() => {
    fs.createReadStream(fromfile).pipe(fs.createWriteStream(tofile));
  }, 9000);
} */
setTimeout(() => {
  let fromfile = path.resolve("dist/index.js");
  let tofile = path.join(path.resolve(), "../light-proxy-net/index.js");
 // fs.createReadStream(fromfile).pipe(fs.createWriteStream(tofile));
  //fs.createReadStream(fromfile).pipe(fs.createWriteStream(path.resolve("index.js")));
}, 16000);
