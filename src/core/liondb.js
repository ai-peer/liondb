const levelup = require("levelup");
const leveldown = require("leveldown");
const { bit2Int, int2Bit } = require("../utils");
const cluster = require("cluster");
const TcFactor = require("./tcfactor");
const Type = {
   String: 1,
   Number: 2,
   Object: 3,
   Buffer: 4,
};
/* 
enum Type {
   String = 1,
   Number = 2,
   Object = 3,
   Buffer = 4,
}
export interface BatchOption {
   type: "del" | "put";
   key;
   value?: any;
}
export interface QueryOption {
   key;
   lt?;
   lte?;
   gt?;
   gte?;
   limit?: number;
} */
/**
 * options: 
 *  struct Options {
      createIfMissing: boolean ;        // 类似于 O_CREATE 选项 default: false
      errorIfExists:boolean ;          // 与上面的选项同时设置会报错 default: false
      paranoidChecks: boolean;
      env: ;                      // leveldb与操作系统底层的交互, default: Env::default()
      infoLog;              // 设置日志级别
      writeBufferZize;      // 设置写缓冲区大小, 可用来调优 defualt: 4096KB
      maxOpenFiles: number;            // 最大打开文件数, 可用来调优  default: 1000
      blockCache: boolean;            // 设置Cache, 可以明显提高性能 defualt: false
      blockSize;             // 设置block块大小 defualt: 4MB
      blockRestartInterval;
      compression;   // 使用的压缩算法, 可以配合Google开源压缩算法使用
      filterPolicy;   // 设置过滤器, 如Bloom Filter, default: NULL

    };
 */
const DefaultOptions = {
   infoLog: "error",
   errorIfExists: false,
};

/**
 * 以多进程/线程模式运行存储
 * @param options
 */
function clusterThread({
   /** 数据库文件名 */
   filename,
   app,
   /** 运行环境, cluster集群, electron, browser:流星器 */
   env, //: "cluster" | "electron";
   /** 是否是主线程 */
   isMaster,
   /** 当前线程 */
   thread,
} = {}) {
   return new TcFactor({
      app: app || "localdb",
      env: env,
      isMaster: isMaster,
      thread: thread,
      executor: () => {
         if (isMaster) {
            return new LionDB(filename);
         } else {
            let res = {};
            for (let key in LionDB.prototype) {
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

/**
 * https://github.com/Level/levelup
 *
 * 本地数据存储, 数据会做持久化到磁盘, 不会丢失
 * =================================================只能在服务端使用, 不能在客户端使用
 *
 */
class LionDB {
   db;
   static cluster = clusterThread;
   constructor(filename) {
      if (cluster.isMaster) {
         this.db = new levelup(leveldown(filename));
         this.db.open(DefaultOptions);
      }
   }
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   async set(key, value, ttl = 0) {
      this.put(key, value, ttl);
   }
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   async put(key, value, ttl = 0) {
      let val = Buffer.from([]);
      let type = Type.Object;

      if (typeof value === "string") {
         type = Type.String;
         val = Buffer.from(value);
      } else if (typeof value === "number") {
         type = Type.Number;
         val = Buffer.from(int2Bit(value));
      } else if (value instanceof Buffer) {
         type = Type.Buffer;
         val = value;
      } else {
         type = Type.Object;
         val = Buffer.from(JSON.stringify(value));
      }
      ttl = ttl <= 0 ? 0 : ttl;
      ttl = Math.min(ttl, Math.pow(2, 32));
      let ttlAt = Buffer.from(int2Bit(ttl, 4));
      let startAt = Buffer.from(int2Bit(Math.floor(Date.now() / 1000), 5));
      val = Buffer.concat([Buffer.from([type]), startAt, ttlAt, val]);
      return this.db.put(key, val, DefaultOptions);
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
   async getFloatSet(key, value, ttl = 0) {
      let value0 = await this.getFloat(key);
      await this.set(key, value, ttl);
      return value0;
   }
   async getString(key, extension = false) {
      let value = await this.get(key, extension);
      return JSON.stringify(value);
   }
   async getInt(key, extension = false) {
      let value = await this.get(key, extension);
      return parseInt(value);
   }
   async getFloat(key, extension = false) {
      let value = await this.get(key, extension);
      return parseFloat(value);
   }
   /**
    * 获取数据
    * @param key
    * @param extension 是否自动延期(默认false, 如果在put时,设置的过期时间, 才会起作用)
    */
   async get(key, extension = false) {
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
   /**
    * 设置过期时间
    * @param key
    * @param ttl
    */
   async expire(key, ttl = 0) {
      ttl = Math.floor(ttl);
      if (ttl < 1) return;
      let value = this.get(key);
      return this.put(key, value, ttl);
   }
   /**
    * 取得增量后的值,并存储
    * @param key
    * @param increment 增量,默认为1
    */
   async increment(key, increment = 1, ttl = 0) {
      let v = (await this.get(key)) || 0;
      v += increment;
      await this.put(key, v, ttl);
      return v;
   }
   /**
    * 删除
    * @param key
    */
   async del(key) {
      if (key === undefined || key === null) return Promise.resolve([]);
      key = String(key);
      if (key.indexOf("*") >= 0) {
         let batchs = [];
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
            delete v.type;
            return v;
         });
      } else {
         await this.db.del(key, DefaultOptions);
         return [{ key: key }];
      }
   }
   /**
    * 批量操作
    * @param ops
    */
   async batch(ops) {
      return this.db.batch(ops, DefaultOptions);
   }
   async clear(ops) {
      return this.db.clear(ops);
   }
   async close() {
      return this.db.close();
   }
   async find(key) {
      //: string | { key: string; limit?: number }
      let list = [];
      let opt = typeof key === "string" ? { key: key } : key;
      await this.iterator(opt, (key, value) => {
         list.push(value);
      });
      return list;
   }
   async iterator({ key, limit } = {}, callback) {
      let searchKey = String(key).trim();
      let isFuzzy = searchKey.endsWith("*");
      searchKey = searchKey.replace(/^\*|\*$/g, "");
      let options = Object.assign({}, { key, limit }, { gte: searchKey, limit: -1 });
      let iterator = this.db.iterator(options);
      return new Promise((resolve, reject) => {
         iterator.seek(searchKey);
         (function next() {
            iterator.next((error, k, v) => {
               if (!k) {
                  //callback && callback();
                  iterator.end((err) => err && console.error("err", err.message));
                  return resolve();
               }
               try {
                  let key = String(k);
                  if (!isFuzzy) {
                     if (key != searchKey) {
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve();
                     }
                  } else {
                     if (!key || !key.startsWith(searchKey)) {
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve();
                     }
                  }

                  let res = analyzeValue(v);
                  let curTime = Math.ceil(Date.now() / 1000);
                  //console.log("ite==>>", key, res.ttl > 0, res.startAt + res.ttl < curTime, res.ttl, res.startAt, curTime )
                  if (res.ttl > 0 && res.startAt + res.ttl < curTime) {
                     this.del(key);
                  } else {
                     callback && callback(key, res.value());
                  }
                  next();
               } catch (err) {
                  iterator.end((err) => err && console.error("err", err.message));
                  resolve();
               }
            });
         })();
      });
   }
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

module.exports = LionDB;
exports.clusterThread = clusterThread;
