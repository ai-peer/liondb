import levelup from "levelup";
import leveljs from "level-js";
import { ILionDB, Type } from "../types";
import { bit2Int, int2Bit } from "../utils/byte";
import { Buffer } from "buffer";
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
   app,
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
                  await _this.iterator({ key: "*", limit: 0 }, async (key, value) => await wait(100));
               } finally {
                  await wait(1 * 60 * 60); //暂停1小时
               }
            }
         }, 2000);
         callback && callback(err, _this);
      });
   }

   /*  async set(key, value, ttl = 0) {
      return this.put(key, value, ttl);
   }

   async put(key, value, ttl = 0) {
      let val = this.toValue(value, ttl);
      return this.db.put(key, val, DefaultOptions);
   }
   toValue(value, ttl = 0) {
      let val = Buffer.from([]);
      let type = Type.Object;
      if (typeof value === "string") {
         type = Type.String;
         val = Buffer.from(value);
      } else if (typeof value === "number") {
         type = Type.Number;
         val = Buffer.from(int2Bit(value));
      } else if (typeof value === "boolean") {
         type = Type.Boolean;
         val = Buffer.from([value === true ? 1 : 0]);
      } else if (value instanceof Buffer) {
         type = Type.Buffer;
         val = value;
      } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
         type = Type.Buffer;
         val = Buffer.from(value);
      } else if (value instanceof DataView) {
         type = Type.Buffer;
         val = Buffer.from(value.buffer);
      } else {
         type = Type.Object;
         val = Buffer.from(JSON.stringify(value));
      }
      ttl = ttl <= 0 ? 0 : ttl;
      ttl = Math.min(ttl, Math.pow(2, 32));
      let ttlAt = Buffer.from(int2Bit(ttl, 4));
      let startAt = Buffer.from(int2Bit(Math.floor(Date.now() / 1000), 5));
      val = Buffer.concat([Buffer.from([type]), startAt, ttlAt, val]);
      return val;
   }
   async getSet(key, value, ttl = 0) {
      let value0 = await this.get(key);
      await this.set(key, value, ttl);
      return value0;
   }
   async getIntSet(key, value, ttl = 0) {
      let value0 = await this.getInt(key);
      await this.set(key, value, ttl);
      return value0;
   }
   async getStringSet(key, value, ttl = 0) {
      let value0 = await this.getString(key);
      await this.set(key, value, ttl);
      return value0;
   }
   async getFloatSet(key, value, ttl = 0): Promise<number> {
      let value0 = await this.getFloat(key);
      await this.set(key, value, ttl);
      return value0;
   }
   async getString(key, extension = false): Promise<string> {
      let value = await this.get(key, extension);
      return JSON.stringify(value);
   }
   async getInt(key, extension = false): Promise<number> {
      let value = await this.get(key, extension);
      return parseInt(value) || 0;
   }
   async getFloat(key, extension = false) {
      let value = await this.get(key, extension);
      return parseFloat(value);
   }

   async get(key, extension = false): Promise<any> {
      let buffer = await this.db.get(key).catch((e) => undefined);
      if (buffer) {
         let res = analyzeValue(buffer);
         if (res) {
            if (res.ttl > 0) {
               let curTime = Math.ceil(Date.now() / 1000);
               if (res.startAt + res.ttl < curTime) {
                  this.del(key);
                  return undefined;
               }
               if (extension) {
                  let newTtl = curTime - res.startAt + res.ttl;
                  let ttlAt = Buffer.from(int2Bit(newTtl, 4));
                  this.db.put(key, Buffer.concat([Buffer.from([res.type]), buffer.slice(1, 6), ttlAt, res.buffer]));
               }
            }
            return res.value();
         }
      }
      return undefined;
   }

   async expire(key, ttl = 0) {
      ttl = Math.floor(ttl);
      if (ttl < 1) return;
      let value = this.get(key);
      return this.put(key, value, ttl);
   }

   async increment(key, increment = 1, ttl = 0) {
      let v = (await this.get(key)) || 0;
      v += increment;
      await this.put(key, v, ttl);
      return v;
   }

   async del(key) {
      if (key === undefined || key === null) return Promise.resolve([]);
      key = String(key);
      if (key.indexOf("*") >= 0) {
         let batchs: { type: "del"; key: string; value?: any }[] = [];
         await this.iterator(
            {
               key: key,
            },
            async (skey, val) => {
               if (batchs.length > 999) return;
               batchs.push({ type: "del", key: skey });
            },
         );
         //console.info("del key b",key, batchs);
         await this.batch(batchs);
         return batchs.map((v) => {
            //delete v.type;
            return {
               key: v.key,
               value: v.value,
            };
         });
      } else {
         await this.db.del(key, DefaultOptions);
         return [{ key: key }];
      }
   }

   async batch(ops: { type: "del" | "put"; key: string; value?: any; ttl?: number }[]) {
      if (ops instanceof Array) {
         ops = ops.map((v) => {
            if (v.type == "put") {
               v.value = this.toValue(v.value, v.ttl);
               delete v.ttl;
            }
            return v;
         });
      }
      return this.db.batch(ops, DefaultOptions);
   }
   async clear(ops) {
      return this.db.clear(ops);
   }
   async close(): Promise<undefined> {
      return new Promise((resolve) => {
         this.db.close(() => setTimeout(() => resolve(undefined), 150));
      });
   }
   async count(key: string): Promise<number> {
      let count = 0;
      await this.iterator({ key: key, start: 0, limit: -1 }, () => count++);
      return count;
   }
   async find({ key, limit = 100, start = 0 }: { key: string; limit?: number; start?: number }): Promise<{ key: string; value: any }[]> {
      let list: { key: string; value: any }[] = [];
      //let opt = typeof key === "string" ? { key: key } : key;
      await this.iterator({ key, limit, start }, (skey, svalue) => {
         list.push({ key: skey, value: svalue });
      });
      return list;
   }
   async iterator({ key, limit = 100, start = 0 }: { key: string; limit?: number; start?: number }, callback): Promise<undefined> {
      let _this = this;
      let searchKey = String(key).trim();
      let isFuzzy = searchKey.endsWith("*");
      searchKey = searchKey === "*" ? searchKey : searchKey.replace(/^\*|\*$/g, "");
      let options = Object.assign({}, { key, limit: start + limit }, { gte: searchKey });
      let iterator = this.db.iterator(options);
      //let type = Object.prototype.toString.call(callback);
      return new Promise((resolve, reject) => {
         let itSize = 0;
         let itIndex = -1;
         if (!iterator) return resolve(undefined);
         iterator.seek(searchKey);
         (function next() {
            //console.info("next====");
            iterator.next(async (error, k, v) => {
               if (!k) {
                  //callback && callback();
                  iterator.end((err) => err && console.error("err", err.message));
                  return resolve(undefined);
               }
               itIndex++;
               //console.info("=====", start, itIndex, start > itIndex);
               if (start > itIndex) {
                  next();
                  return;
               }

               try {
                  let sKey = String(k);
                  if (!isFuzzy) {
                     if (sKey != searchKey) {
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve(undefined);
                     }
                  } else {
                     //console.info("========>>>>", key, sKey, searchKey, limit, itIndex, itSize, !sKey || !sKey.startsWith(searchKey) || (limit > 0 && itSize >= limit));
                     if (!sKey || !sKey.startsWith(searchKey) || (limit > 0 && itSize >= limit)) {
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve(undefined);
                     }
                  }
                  itSize++;
                  let res: any = analyzeValue(v);
                  let curTime = Math.ceil(Date.now() / 1000);
                  //console.log("ite==>>", key, res.ttl > 0 && res.startAt + res.ttl < curTime, res.ttl, !!callback);
                  if (res.ttl > 0 && res.startAt + res.ttl < curTime) {
                     _this.del(sKey);
                     await wait(5);
                  } else {
                     if (!!callback) {
                        let callbackResult = await callback(sKey, res.value());
                        if (callbackResult === "break") {
                           iterator.end((err) => err && console.error("err break", err.message));
                           return resolve(undefined);
                        }
                     }
                  }
                  next();
               } catch (err) {
                  console.info("err", err.stack);
                  iterator.end((err) => err && console.error("err", err.message));
                  resolve(undefined);
               }
            });
         })();
      });
   } */
}
function analyzeValue(value) {
   try {
      let type = value[0];
      let startAt = bit2Int(value.slice(1, 6));
      let ttl = bit2Int(value.slice(6, 10));
      let val = value.slice(10);

      if (String(startAt).startsWith("63")) {
         startAt = Math.floor(Date.now() / 1000) - 1;
         ttl = 1;
      }

      return {
         ttl,
         value: () => {
            let result;
            switch (type) {
               case Type.String:
                  result = val.toString();
                  break;
               case Type.Number:
                  result = bit2Int(val);
                  break;
               case Type.Boolean:
                  result = val[0] >= 1 ? true : false;
                  break;
               case Type.Buffer:
                  result = val;
                  break;
               case Type.Object:
                  result = JSON.parse(val.toString());
                  break;
            }
            return result;
         },
         startAt,
         type,
         buffer: val,
      };
   } catch (e) {
      return undefined;
   }
}
async function wait(ttl = 100) {
   return new Promise((resolve) => setTimeout(() => resolve(undefined), ttl));
}
