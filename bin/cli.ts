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