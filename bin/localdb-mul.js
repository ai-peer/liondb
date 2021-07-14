//import program from "commander";
const path = require("path");
const os = require("os");
const LionDB = require("../src");

const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
   console.log(`Primary ${process.pid} is running`);
   let db = LionDB.clusterThread({ filename: path.resolve("_local/2"), env: "cluster", isMaster: true, thread: cluster });
   // 衍生工作进程
   for (let i = 0; i < 1; i++) {
      cluster.fork();
   }
   (async () => {
      await db.set("a-13", "v13");
      await db.set("a-14", "v14");
   })();
   /*    cluster.on("exit", (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
   }); */
} else {
   let db = LionDB.clusterThread({ filename: path.resolve("_local/2"), env: "cluster", isMaster: false, thread: cluster.worker });
   (async () => {
      let k1 = "a-1";
      //await db.set(k1, "v1");
      let v1 = await db.get(k1);
      console.info("v1", v1);

      await db.iterator({ key: "a*" }, async (key, value) => {
         await wait(100);
         console.info("worker iterator ", key, value);
      });

      let list1 = await db.find({ key: "a*", start: 2, limit: 2 });
      console.info("list ", list1);

      console.info("iterator end");
   })();
   console.log(`Worker ${process.pid} started`);
}
async function wait(ttl) {
   return new Promise((resolve) => setTimeout(() => resolve(), ttl));
}
