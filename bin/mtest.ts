import os from "os";
import path from "path";
import cluster from "cluster";
import LionDB from "../src";

console.info("init==========");
//let db = LionDB.worker({ filename: path.resolve("_local/3"), env: "cluster", isMaster: false, thread: cluster });
let db = LionDB.worker({
   filename: path.resolve("_local/1"),
   env: "cluster",
   isMaster: cluster.isPrimary,
   thread: cluster.isPrimary ? cluster : cluster.worker,
});
let db1 = LionDB.worker({
   filename: path.resolve("_local/2"),
   env: "cluster",
   isMaster: cluster.isPrimary,
   thread: cluster.isPrimary ? cluster : cluster.worker,
});
async function execr(db: LionDB, name: string) {
   //await db.set("ref_a", "aa2");
   await db.set("am", {app: `${name}`, name: `db-${name}-${cluster.worker?.id || "master"}`, age: Math.ceil(Math.random() * 100) });

   /*let v0 = await db.get("aa2");
   console.info("v0", v0);

   let refVal = await db.find({ key: "ref_a*", query: {} });
   console.info("===refVal", refVal); */

   let list = await db.find({
      key: "a*",
      flow: true,
      //index: "code",
      limit: 3,
      query: { $gt: { age: 13 } },
   });
   console.info("list==", name, cluster.worker?.id, list);
   /* 
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
 */
   //////////////////////////
   /*   let itCount = 0,
      start = 0;
   while (true) {
      start = Date.now();
      console.info("start", ++itCount);
      await db.iterator({ key: "task-*", limit: 999 }, async (key, value) => {
         //console.info("key", key)
         await wait(10);
      });
      console.info("ttl=", Math.ceil((Date.now() - start) / 1000), itCount);
   } */
}
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
if (cluster.isPrimary) {
   console.info("===master", os.cpus().length);
   for (let i = 0; i < os.cpus().length; i++) cluster.fork();
} else {
   console.info("worker run", cluster.worker?.id);
   execr(db, "db");
   execr(db1, "db1");
}
