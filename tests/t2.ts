import LionDB from "../src";
import cluster from "cluster";

(() => {
   if (cluster.isMaster) {
      let liondb: LionDB = LionDB.worker({
         filename: "../_local/5",
         env: "cluster",
         isMaster: cluster.isMaster,
         thread: cluster.isMaster ? cluster : cluster.worker,
      });
      liondb.on("open", () => console.info("open master"));
      cluster.fork();
   } else {
      let liondb: LionDB = LionDB.worker({
         filename: "../_local/5",
         env: "cluster",
         isMaster: cluster.isMaster,
         thread: cluster.isMaster ? cluster : cluster.worker,
      });
      liondb.on("open", async () => {
         console.info("open worker");
         await liondb.iterator({ key: "*" }, async (key, val) => {
            await liondb.del(key);
         });
         await liondb.del("one");
         await liondb.set("one", { name: "one" });
         let val = await liondb.get("one");
         console.info("val", val);
      });
   }
})();
