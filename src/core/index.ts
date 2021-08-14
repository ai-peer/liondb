/* import LionDBBrowser from "./liondb.browser";
import LionDBNode from "./liondb.node";
  */
const isBrowser = !!globalThis.window;

console.info("============isBrowser", isBrowser);
const LionDB = isBrowser ? require("./liondb.browser") : require("./liondb.node");
//const LionDB = isBrowser ? LionDBBrowser : LionDBNode;
export default LionDB;
module.exports = LionDB;