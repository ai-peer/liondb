const path = require("path");
const os = require("os");
const cluster = require("cluster");
const LionDB = require("./node");

console.info("xxx", LionDB);
let liondb = new LionDB("/.aaa");
(async () => {
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
   //await batchCreate();
   let as = await liondb.find({ key: "b*" });
   console.info("gett as=========", as);
   let startTime = Date.now();
   let count = await liondb.count("id*");

   console.info("count", count,  "ttl=", Date.now() - startTime);
   startTime = Date.now();
   let list = await liondb.find({ key: "id*", start: 5000, limit: 20 });
   console.info("==>>list", list.length, "ttl=", Date.now() - startTime);

   await testGetTTl();
})();
async function testGetTTl() {
   let startTime = Date.now();
   for (let i = 0; i < 1000; i++) {
      await liondb.get("id-0_0_1631089338832");
   }
   console.info("testGetTTl ttl", Date.now() - startTime);
}
async function batchCreate(count = 100000, bodyLength = 4096) {
   let startTime = Date.now();

   for (let i = 0; i < count; i += 100) {
      let batch = array(100).map((v, j) => {
         let id = "id-" + i + "_" + j + "_" + Date.now();
         return {
            type: "put",
            key: id,
            value: {
               id: id,
               createAt: new Date(),
               status: 1,
               name: "title=" + i + "-" + j,
               body: array(Math.floor(Math.random() * (bodyLength - 1024) + 1024))
                  .map((v1, j1) => {
                     let s = 48 + Math.floor(Math.random() * (122 - 48));
                     return String.fromCharCode(s);
                  })
                  .join(""),
            },
         };
      });
      //console.info("batch ", batch.length)
      await liondb.batch(batch);
   }
   console.info(`handle count=${count} bodyLength=${bodyLength}`, "ttl=", Date.now() - startTime);
}
function array(size) {
   let list = [];
   for (let i = 0; i < size; i++) {
      list[i] = 0;
   }
   return list;
}
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
