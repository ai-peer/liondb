import levelup from "levelup";
import leveldown from "leveldown";
import { ILionDB, Type, LionDBOptions } from "../types";
import { mkdirs } from "../utils";
import { bit2Int, int2Bit } from "../utils/byte";
import TcFactor from "./tcfactor";
import LionDB from "./liondb";

export function worker({
   filename,
   env, //: "cluster" | "electron" | "egg";
   isMaster,
   thread,
}: //app,
{
   /** 数据库文件名 */
   filename: string;
   //app: string;
   /** 运行环境, cluster集群, electron, browser:流星器 */
   env?: "cluster" | "electron" | "egg" | "browser";
   /** 是否是主线程 */
   isMaster?: boolean;
   /** 当前线程 */
   thread?: any;
   /** 应用名， 用作信息隔离 */
   //app: string;
}): LionDB {
   let app = filename.replace(/[^a-z0-9]+/g, "_").replace(/^[^a-z0-9]+/, "");
   env = env || "cluster";
   isMaster = isMaster === false ? false : true;
   thread = thread || (() => require("cluster"))();
   return new TcFactor<LionDB>({
      app: app || "localdb",
      env: env,
      isMaster: isMaster,
      thread: thread,
      executor: () => {
         if (isMaster) {
            return new LionDBNode(filename);
         } else {
            let res = {};
            for (let key of [
               "set",
               "get",
               "put",
               "getSet",
               "getIntSet",
               "getStringSet",
               "getFloatSet",
               "getString",
               "getInt",
               "getFloat",
               "expire",
               "increment",
               "del",
               "batch",
               "clear",
               "close",
               "find",
               "iterator",
               "count",
               "exist",
            ]) {
               let target = LionDB.prototype[key];
               if (key.startsWith("_")) continue;
               if (target instanceof Function) {
                  //res[key] = target;
                  res[key] = () => {};
               }
            }
            return res;
         }
      },
   }).executor;
}
//levelup.prototype.set = levelup.prototype.put;
/**
 * https://github.com/Level/levelup
 *
 * 本地数据存储, 数据会做持久化到磁盘, 不会丢失
 * =================================================只能在服务端使用, 不能在客户端使用
 *
 */
export default class LionDBNode extends LionDB {
   static worker = worker;
   constructor(filename: string) {
      super();
      let _this = this;
      mkdirs(filename);
      let ldb = leveldown(filename);
      this.db = new levelup(ldb, {}, async (err, db) => {
/*          setTimeout(async () => {
            while (true) {
               //自动清理过期内容
               try {
                  await _this.iterator({ key: "*", limit: 0 }, async (key, value) => {
                     await wait(100);
                  });
               } finally {
                  await wait(1 * 60 * 60); //暂停1小时
               }
            }
         }, 2000); */
         //callback && callback(err, _this);
      });
   }
}
async function wait(ttl = 100) {
   return new Promise((resolve) => setTimeout(() => resolve(undefined), ttl));
}
