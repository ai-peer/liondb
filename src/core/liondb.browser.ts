import levelup from "levelup";
import leveljs from "level-js";
import LionDB from "./liondb";

const DefaultOptions = {
   sync: false,
   infoLog: "error",
   errorIfExists: false,
};

export function worker(opts: {
   /** 数据库文件名 */
   filename: string;
   app: string;
   env: "browser";
   isMaster: boolean;
   thread: any;
}): LionDB {
   return new LionDBBrowser(opts);
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
   static worker = worker;
   constructor(opts: { filename: string; [key: string]: any }) {
      super();
      let _this = this;
      let ldb = leveljs(opts.filename, {prefix: "ldb-"});
      this.db = new levelup(ldb, {}, async (err) => {
         this.emit("open");
         //callback && callback(err, _this);
      });
   }
}
async function wait(ttl = 100) {
   return new Promise((resolve) => setTimeout(() => resolve(undefined), ttl));
}
