import assert from "assert";
import LionDB from "../src/index";
import path from "path";
let db = new LionDB(path.resolve("_local/1"));

beforeEach(async function() {
   await wait(1000);
   await db.del("aa");
   await db.set("aa", { name: "li lei" });
   await db.set("a1", { name: "a1" });
   await db.set("a2", { name: "a2" });
   await db.set("a3", { name: "a3" });
   await db.set("a4", { name: "a4" });
   await db.set("b1", { name: "b1" });
   await db.set("b2", { name: "b2" });
});

describe("比较取值", function() {
   it("比较取值是否相等", async function() {
      const vv = await db.get("aa");
      assert.deepStrictEqual(vv.name, "li lei");
   });
   it("查询", async function() {
    db.iterator({key: "a*"}, (key, value)=>{
      console.log("v", key, value)
    });
    let bb = await db.find("b*");
    console.log(">>>>bb", bb);

    let list = await db.find("a1");
    console.log("list ==", list);
 });
});
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
