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
import { Buffer } from "buffer";
//let db: ILionDB = new lionDB(path.resolve("_local/1"));
let db = LionDB.worker({
   filename: path.resolve("_local/1"),
   env: "cluster",
   isMaster: cluster.isMaster,
   thread: cluster.isMaster ? cluster : cluster.worker,
});

async function start() {
   /*    for (let i = 100000; i < 200000; i++) {
      await db.set("task-" + i, {
         text: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + "-" + Math.random().toString(36).slice(2),
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
   /* let buf = Buffer.from("abc");
   await db.set("buf", buf);
   console.info("====>", await db.get("buf"));
   let startTime0=Date.now();
   let count = await db.total();
   console.info("count1=", count, Date.now() - startTime0);
   startTime0=Date.now();
   count = await db.count("*");
   console.info("count2=", count, Date.now() - startTime0);

   console.info("has== task-1001", await db.has("task-10012"));
   let list = await db.find({
      key: "task*",
      limit: 10,
      start: 10,
      keys: true,
   }); */
   //console.info("find list===>>1", list);

   let startTime = Date.now();
   let list0: any[] = [];
   //for (let i = 0; i < 10; i++) {
   await db.iterator({ key: "task*", start: 130000 + 10, limit: 10 }, (key, val) => {
      list0.push(val);
   });
   //}

   console.info("find reverse list===>>1", Math.ceil((Date.now() - startTime) / 10) + "ms", list0);
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
