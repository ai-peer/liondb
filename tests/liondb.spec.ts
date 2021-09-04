import assert from "assert";
import LionDB from "../src";
import path from "path";
import { ILionDB } from "../src/types";

let liondb: ILionDB = new LionDB(path.resolve("_local/1"));
 
beforeEach(async function () {
   await wait(1000);
   //await db.del("aa");
   await liondb.set("aa", { name: "li lei" });
   console.info(">>>>aa", await liondb.get("aa"));
   await liondb.set("a1", { name: "a1" });

   /*    await db.set("a2", { name: "a2" });
   await db.set("a3", { name: "a3" });
   await db.set("a4", { name: "a4" });
   await db.set("b1", { name: "b1" });
   await db.set("b2", { name: "b2" }); */
   await liondb.batch([
      {
         type: "put",
         key: "a2",
         value: { name: "a2" },
      },
      {
         type: "put",
         key: "a3",
         value: { name: "a3" },
      },
      {
         type: "put",
         key: "a4",
         value: { name: "a4" },
      },
      {
         type: "put",
         key: "b1",
         value: { name: "b1" },
      },
      {
         type: "put",
         key: "b2",
         value: { name: "b2" },
      },
      {
         type: "put",
         key: "b3",
         value: { name: "b3" },
      },
      {
         type: "put",
         key: "b4",
         value: { name: "b4" },
      },
      {
         type: "put",
         key: "bc1",
         value: { name: "bc1" },
      },
      {
         type: "put",
         key: "bc2",
         value: { name: "bc2" },
      },
   ]);
   let list0 = await liondb.find({ key: "b*" });
   console.info("list0", list0);
   let list1 = await liondb.find({ key: "b*", reverse: true });
   console.info("list1", list1);
   // console.info("count=", await db.count("kid-*"));
});

describe("单进程比较取值", function () {
   it("比较取值是否相等", async function () {
      const vv = await liondb.get("aa");
      console.info(">>>vv2", vv);
      assert.deepStrictEqual(vv.name, "li lei");
   });
   it("查询", async function () {
    /*   liondb.iterator({ key: "a*" }, (key, value) => {
         console.log("v", key, value);
      }); */
      let bb = await liondb.find({ key: "b*", limit: 2 });
      console.log(">>>>bb", bb);

      let list = await liondb.find({ key: "a1" });
      console.log("list ==", list);
   });
   it("count", async () => {
      let count = await liondb.count("a*");
      console.info("count", count);
   });
});
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
