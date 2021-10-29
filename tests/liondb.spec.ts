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
   console.info(">>>>existt a1", await liondb.exist("a1"));
   console.info(">>>>existt a1xxxxxx", await liondb.exist("a1xxxxxx"));
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
      {
         type: "put",
         key: "中国福建",
         value: { name: "中国福建" },
      },
      {
         type: "put",
         key: "中国广东",
         value: { name: "中国广东" },
      },
      {
         type: "put",
         key: "中国广西",
         value: { name: "中国广西" },
      },
      {
         type: "put",
         key: "中国四川",
         value: { name: "中国四川" },
      },
      {
         type: "put",
         key: "中国上海",
         value: { name: "中国上海" },
      },
   ]);
   let manyList = await liondb.getMany("b1", "a1", "a2", "b3", "c10");
   console.info("getMany", manyList);
   /*    let list0 = await liondb.find({ key: "b*" });
   console.info("list0", list0);
   let list1 = await liondb.find({ key: "b*", reverse: true });
   console.info("list1", list1); */
   // console.info("count=", await db.count("kid-*"));

   await liondb.del("b*", "b2");
   let list = await liondb.find({ key: "*" });
   console.info("list=====>>>", list);

   console.info("stats ", await liondb.getProperty("leveldb.stats"))
   console.info("sstables ", await liondb.getProperty("leveldb.sstables"))

});

describe("单进程比较取值", function () {
   it("比较取值是否相等", async function () {
      const vv = await liondb.get("aa");
      console.info(">>>vv2", vv);
      assert.deepStrictEqual(vv.name, "li lei");
      let list = await liondb.find({
         key: "中国*",
         filter: (value) => {
            return /^中国广/.test(value.name); // value.name == "b1";
         },
      });
      console.info("list===", list);
      /*    let count = await liondb.count("中国*", (value) => {
         return /^中国广/.test(value.name); // value.name == "b1";
      }); */
      let count = await liondb.count("*");
      console.info("count===============", count);
   });
   it("查询", async function () {
      /*   liondb.iterator({ key: "a*" }, (key, value) => {
         console.log("v", key, value);
      }); */
      let bb = await liondb.find({ key: "b*", limit: 2 });
      console.log(">>>>bb", bb);

      let list: any[] = await liondb.find({ key: "a1", keys: false });
      console.log("list ==00", list);
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
