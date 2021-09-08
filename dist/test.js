const path = require("path");
const os = require("os");
const cluster = require("cluster");
const LionDB = require("./node");
console.info("xxx", LionDB);
(async () => {
   let liondb = new LionDB("/.aaa");
   console.info("============");
   await liondb.set("a", "axxxa");
   let a = await liondb.get("a");
   console.info("gett=========", a);

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

   let as = await liondb.find({key: "b*"});
   console.info("gett as=========", as);
})();
/* const liondb = LionDB.clusterThread({
   filename: path.join(__dirname, "_local/2"),
   env: "cluster",
   isMaster: cluster.isMaster,
   thread: cluster.isMaster ? cluster : cluster.worker,
});
(async () => {
   await wait();
   await liondb.set("kk21", { name: "liming" });
   let v = await liondb.get("kk21");
   if (cluster.isMaster) {
      console.info("=== master ", v);
   } else {
      console.info("=== worker", v, cluster.worker.id);
   }
})();
async function wait(ttl = 300) {
   return new Promise((resolve) => setTimeout(() => resolve(), ttl));
}
//const liondb = new LionDB(path.join(__dirname, ".liondb1"));

if (cluster.isMaster) {
   for (let i = 0; i < 2; i++) {
      cluster.fork();
   }
} else {
}
 */
