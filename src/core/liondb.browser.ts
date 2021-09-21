import levelup from "levelup";
import leveljs from "level-js";
/* import { ILionDB, Type } from "../types";
import { bit2Int, int2Bit } from "../utils/byte";
import { Buffer } from "buffer"; */
import LionDB from "./liondb";
//import cluster from "cluster";

const DefaultOptions = {
   sync: false,
   infoLog: "error",
   errorIfExists: false,
};

export function clusterThread({
   /** 数据库文件名 */
   filename,
   /** 运行环境, cluster集群, electron, browser:流星器 */
   env, //: "browser";
   /** 是否是主线程 */
   isMaster,
   /** 当前线程 */
   thread,
}: {
   filename: string;
   app: string;
   env: "cluster" | "electron" | "egg";
   isMaster: boolean;
   thread: any;
}) {
   return new LionDBBrowser(filename);
}
//levelup.prototype.set = levelup.prototype.put;
/**
 * https://github.com/Level/levelup
 *
 * 本地数据存储, 数据会做持久化到磁盘, 不会丢失
 * =================================================只能在服务端使用, 不能在客户端使用
 *
 */
export default class LionDBBrowser extends LionDB {
   static clusterThread = clusterThread;
   constructor(filename: string, callback?: Function) {
      super();
      let _this = this;
      let ldb = leveljs(filename);
      this.db = new levelup(ldb, {}, async (err, db) => {
         setTimeout(async () => {
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
         }, 2000);
         callback && callback(err, _this);
      });
   }
}
async function wait(ttl = 100) {
   return new Promise((resolve) => setTimeout(() => resolve(undefined), ttl));
}
