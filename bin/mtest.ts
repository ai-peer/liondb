import os from "os";
import path from "path";
import cluster from "cluster";
import LionDB from "../src";

console.info("init==========");
//let db = LionDB.worker({ filename: path.resolve("_local/3"), env: "cluster", isMaster: false, thread: cluster });
let db = LionDB.worker({
   filename: path.resolve("_local/1"),
   env: "cluster",
   isMaster: cluster.isMaster,
   thread: cluster.isMaster ? cluster : cluster.worker,
});
async function execr() {
   console.info("execr===========", db.find);
   await db.set("ref_a", "aa2");
   await db.set("aa2", { name: "aa2", age: 12 });

   let v0 = await db.get("aa2");
   console.info("v0", v0);

   let refVal = await db.find({ key: "ref_a*", query: {}, isRef: true });
   console.info("===refVal", refVal);

   let list = await db.find({
      key: "*",
      //index: "code",
      limit: 3,
      query: { name: "*2", $gt: { age: 10 } },
   });
   console.info("list==", list);

   let list2: any[] = [];
   await db.iterator(
      {
         key: "*",
         filter: (v) => {
            return /^li/i.test(v.name);
         },
      },
      (key, value) => {
         console.info("key", key, value);
         list2.push(value);
      },
   );
   console.info("list2==", list2);

   //////////////////////////
   let itCount = 0,
      start = 0;
   while (true) {
      start = Date.now();
      console.info("start", ++itCount);
      await db.iterator({ key: "task-*", limit: 999 }, async (key, value) => {
         //console.info("key", key)
         await wait(10);
      });
      console.info("ttl=", Math.ceil((Date.now() - start) / 1000), itCount);
   }
}
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
if (cluster.isMaster) {
   console.info("===master");
   cluster.fork();
} else {
   execr();
}
