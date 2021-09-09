const assert = require("assert");
import lionDB from "../src";
const path = require("path");
const cluster = require("cluster");

let db = lionDB.clusterThread({ filename: path.resolve("_local/2"), env: "cluster", isMaster: true, thread: cluster });
let db1 = lionDB.clusterThread({ filename: path.resolve("_local/3"), env: "cluster", isMaster: true, thread: cluster });
console.info(">>>", path.resolve("_local"));

beforeEach(async function () {
   await wait(1000);
   await db.del("aa");
   await db.set("aa", { name: "li lei" });
});

describe("多进程比较取值", function () {
   it("比较取值是否相等", async function () {
      const vv = await db.get("aa");
      assert.deepStrictEqual(vv.name, "li lei");
      let count = await db.count("a*");
      console.info("==count", count);
   });
});
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
