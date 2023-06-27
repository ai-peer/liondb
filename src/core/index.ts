/* import LionDBBrowser from "./liondb.browser";
import LionDBNode from "./liondb.node";
  */
/* const isBrowser = !!globalThis.window;
console.info("LionDB run in browser", isBrowser);
const LionDB = isBrowser ? require("./liondb.browser") : require("./liondb.node"); */
import LionDB from "./liondb.node";

export { LionDB as default };
