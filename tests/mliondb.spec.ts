const assert = require( "assert");
import lionDB from "../src";
const path  = require( "path");
const cluster  = require( 'cluster');

let db = lionDB.clusterThread({filename:  path.resolve("_local/2"), env: "cluster", isMaster: true, thread: cluster });
console.info(">>>", path.resolve("_local"));

beforeEach(async function() {
   await wait(1000);
   await db.del("aa");
   await db.set("aa", { name: "li lei" });
});

describe("多进程比较取值", function() {
   it("比较取值是否相等", async function() {
      const vv = await db.get("aa");
      assert.deepStrictEqual(vv.name, "li lei");
   });
});
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
