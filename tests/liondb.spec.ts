import assert from "assert";
import lionDB from "../src";
import path from "path";
import { ILionDB } from "../src/types";

let db: ILionDB = new lionDB(path.resolve("_local/1"));

beforeEach(async function () {
   await wait(1000);
   //await db.del("aa");
   await db.set("aa", { name: "li lei" });
   console.info(">>>>aa", await db.get("aa"));
   await db.set("a1", { name: "a1" });

   /*    await db.set("a2", { name: "a2" });
   await db.set("a3", { name: "a3" });
   await db.set("a4", { name: "a4" });
   await db.set("b1", { name: "b1" });
   await db.set("b2", { name: "b2" }); */
   await db.batch([
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

  // console.info("count=", await db.count("kid-*"));
});


describe("单进程比较取值", function () {
   it("比较取值是否相等", async function () {
      const vv = await db.get("aa");
      console.info(">>>vv2", vv);
      assert.deepStrictEqual(vv.name, "li lei");
   });
   it("查询", async function () {
      db.iterator({ key: "a*" }, (key, value) => {
         console.log("v", key, value);
      });
      let bb = await db.find({ key: "b*", limit: 2 });
      console.log(">>>>bb", bb);

      let list = await db.find({ key: "a1" });
      console.log("list ==", list);
   });
   it("count", async () => {
      let count = await db.count("a*");
      console.info("count", count);
   });
});
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
