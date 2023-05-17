import levelup from "levelup";
import leveldown from "leveldown";
import { mkdirs } from "../utils";
import TcFactor from "./tcfactor";
import LionDB, { Event } from "./liondb";
import cluster from "cluster";
import EventEmitter from "eventemitter3";

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
   thread = thread || cluster;
   return new TcFactor<LionDB>({
      app: app || "localdb",
      env: env,
      isMaster: isMaster,
      thread: thread,
      executor: () => {
         if (isMaster) {
            return new LionDBNode(filename);
         } else {
            class Sub extends EventEmitter<Event> {}
            let res = new Sub();
            for (let key of [
               "set",
               "get",
               "getMany",
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
               "getProperty",
            ]) {
               let target = LionDB.prototype[key];
               if (key.startsWith("_")) continue;
               if (target instanceof Function) {
                  //res[key] = target;
                  res[key] = () => {};
               }
            }
            setTimeout(() => {
               res.emit("open");
            }, 1000);
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
      mkdirs(filename);
      let ldb = leveldown(filename);
      this.db = new levelup(ldb, {}, async (err) => {
         if (err) {
            this.emit("error", err);
            return;
         }
         this.emit("open");
      });
   }
}
/* async function wait(ttl = 100) {
   return new Promise((resolve) => setTimeout(() => resolve(undefined), ttl));
} */
