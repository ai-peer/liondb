import os from "os";
import path from "path";
import cluster from "cluster";
import LionDB from "../src";

console.info("init==========");
//let db = LionDB.worker({ filename: path.resolve("_local/3"), env: "cluster", isMaster: false, thread: cluster });
let db = LionDB.worker({
   filename: path.resolve("_local/3"),
   env: "cluster",
   isMaster: cluster.isMaster,
   thread: cluster.isMaster ? cluster : cluster.worker,
});
async function execr() {
   console.info("execr===========", db.find);
   //await db.set("aa1", {name: "aa1"});
   let list = await db.find({
      key: "a*",
      //query: {},
      //index: "code",
      limit: 3,
      filter: (v) => {
         return /^li/i.test(v.name);
         //return true;
      },
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
}
if (cluster.isMaster) {
   console.info("===master");
   cluster.fork();
} else {
   execr();
}
