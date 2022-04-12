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
import lionDB from "../src";
import path from "path";
import { ILionDB } from "../src/types";
let db: ILionDB = new lionDB(path.resolve("_local/1"));

async function start() {
   let start = Date.now();
   /*    for (let i = 0; i < 5; i++) {
      await db.set("kid-" + i + "-" + Math.ceil(Math.random() * 999999), {
         text: toRandString(),
         name: "name-" + i,
         id: i,
      });
   } */
   let key = "abc51";
   await db.set(key, 1);
   let v = await db.get(key);
   console.info("v", v);
   let count = await db.count("kid-*");
   console.info("output ", Date.now() - start, count);
   let list0 = await db.find({ key: "kid-*", limit: 2 });
   console.info("list0", list0);
   let list1 = await db.getMany("kid-0-485283", "kid-0-273632");
   console.info("list1", list1);
   await db.del("kid-*")
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
