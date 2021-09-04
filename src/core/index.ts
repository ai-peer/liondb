/* import LionDBBrowser from "./liondb.browser";
import LionDBNode from "./liondb.node";
  */
const isBrowser = !!globalThis.window;
console.info("LionDB run in browser", isBrowser);
const LionDB = isBrowser ? require("./liondb.browser") : require("./liondb.node");

export default LionDB;
module.exports = LionDB;
