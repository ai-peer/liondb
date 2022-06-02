/* import { Command } from "commander";
import pkg from "../package.json";
import LionDB from "../src";
 
const program = new Command();

 

let config: any = program
   .version(pkg.version)
   .description(pkg.description)
   .option("-t, --type [value]", "操作类型，get put del", "get")
   .option("-k, --key [value]", "key值", "")
   .option("-v, --value [value]", "给值，put时有用", "")
   .option("--ttl [value]", "有效期，单位秒，默认不过期，0=不过期", "0")
   .parse(process.argv)
   .opts();
 */
import LionDB from "../src";
import path from "path";
import { ILionDB } from "../src/types";
import cluster from "cluster";
//let db: ILionDB = new lionDB(path.resolve("_local/1"));
let db = LionDB.worker({
   filename: path.resolve("_local/1"),
   env: "cluster",
   isMaster: cluster.isMaster,
   thread: cluster.isMaster ? cluster : cluster.worker,
});

async function start() {
   /*    for (let i = 0; i < 100000; i++) {
      await db.set("task-" + i, {
         text: toRandString(),
         name: "task-" + i,
         id: i,
      });
   } */
   /*  let key = "abc51";
   await db.set(key, 1);
   let v = await db.get(key);
   console.info("v", v);
   let startTime = Date.now();
   let count0 = await db.count("*");
   console.info("count ttl=", count0, Date.now() - startTime, (startTime = Date.now()));
   let count = await db.countQuick();
   console.info("output ttl=", Date.now() - startTime, "s count=", count, count0);
   let list0 = await db.find({ key: "kid-*", limit: 2 });
   console.info("list0", list0);
   let list1 = await db.getMany("kid-0-485283", "kid-0-273632");
   let list = await db.find({ key: "task-*", limit: 10 });
   console.info("list", list);

   //////////////////////////
   let itCount = 0,
      start = 0;
   // while (true) {
   start = Date.now();
   await db.iterator({ key: "task-*", limit: 99 }, async (key, value) => {
      //console.info("key", key)
      await wait(100);
   });
   console.info("ttl=", Math.ceil((Date.now() - start) / 1000), ++itCount); */
   //}
   let list = await db.find({
      key: "task*",
      limit: 10,
      start: 10
   });
   console.info("find list===>>1", list);

   list = await db.find({
      key: "task*",
      reverse: true,
      limit: 10,
   });
   console.info("find reverse list===>>1", list);
}
async function wait(ttl) {
   return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), ttl);
   });
}
function toRandString() {
   let list: string[] = [];
   let chars: string[] = [];
   for (let i = 65; i < 122; i++) chars.push(String.fromCharCode(i));
   for (let i = 0; i < 10; i++) {
      list.push(chars[Math.floor(Math.random() * chars.length)]);
   }
   return list.join("");
}
start();
