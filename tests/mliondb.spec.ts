const assert = require("assert");
import lionDB from "../src";
const path = require("path");
const cluster = require("cluster");

let db1 = lionDB.worker({ filename: path.resolve("_local/3"), env: "cluster", isMaster: true, thread: cluster });
let db2 = lionDB.worker({ filename: path.resolve("_local/2"), env: "cluster", isMaster: true, thread: cluster });
console.info(">>>", path.resolve("_local"));

beforeEach(async function () {
   await wait(1000);
   await db1.del("aa");
   await db1.set("aa", { name: "li lei" });

   await db2.del("aa");
   await db2.set("aa", { name: "li leixxx" });
});
 
describe("多进程比较取值2===================", function () {
   it("比较取值是否相等", async function () {
      const vv = await db2.get("aa");
      console.info("vv----===", vv)
      let count = await db2.count("a*");
      console.info("==count", count);
      let list = await db2.find({key: "*", filter: (v)=>{
         console.info("v", v);
         return true
      }});
      console.info("list", list)

      let manyList = await db2.getMany("aa", "a1", "a2", "b3", "c10");
      console.info("多进程 getMany", manyList);
   });
});
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
