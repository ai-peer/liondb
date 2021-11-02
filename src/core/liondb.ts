import { Type, ILionDB, Filter, IteratorCallback } from "../types";
import { bit2Int, int2Bit } from "../utils/byte";
import { Buffer } from "buffer";
import levelup from "levelup";

const DefaultOptions = {
   sync: false,
   infoLog: "error",
   errorIfExists: false,
};
levelup.prototype.set = levelup.prototype.put;
export default class LionDB implements ILionDB {
   public static readonly Break = "break";
   protected db;

   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   async set(key, value, ttl = 0) {
      await this.put(key, value, ttl);
   }
   /**
    * 设置值
    * @param key key关键字
    * @param value 值
    * @param ttl 过期时间, 默认=0表示不过期,单位s(秒)
    */
   async put(key, value, ttl = 0) {
      let val = this.toValue(value, ttl);
      await new Promise((resolve) => this.db.put(key, val, DefaultOptions, () => resolve(undefined)));
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
   /**
    * 获取数据
    * @param key
    * @param extension 是否自动延期(默认false, 如果在put时,设置的过期时间, 才会起作用)
    */
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
   async getMany(...keys: string[]): Promise<any[]> {
      let bufs = await this.db.getMany(keys, {}).catch((e) => undefined);
      let vals: any[] = [];
      for (let i = 0; i < bufs.length; i++) {
         let key = keys[i];
         let buffer = bufs[i];
         let res = analyzeValue(buffer);
         if (res) {
            if (res.ttl > 0) {
               let curTime = Math.ceil(Date.now() / 1000);
               if (res.startAt + res.ttl < curTime) {
                  this.del(key);
                  vals.push(undefined);
               }
            }
            vals.push(res.value());
         } else {
            vals.push(undefined);
         }
      }
      return vals;
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
    * 存在
    * @param key
    */
   async exist(key: string): Promise<boolean> {
      let ex = false;
      await this.iterator({ key, limit: 1, values: false }, (skey) => {
         ex = skey === key;
      });
      return ex;
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
   async del(...keys: string[]) {
      if (keys.length < 1) return Promise.resolve();
      let batchs: { type: "del"; key: string; value?: any }[] = [];
      keys = keys.filter((v) => v != undefined);
      for (let key of keys) {
         if (key.indexOf("*") >= 0) {
            await this.iterator(
               {
                  key: key,
               },
               async (skey, val): Promise<any> => {
                  if (batchs.length > 999) return LionDB.Break;
                  batchs.push({ type: "del", key: skey });
               },
            );
         } else {
            //await this.db.del(key, DefaultOptions);
            batchs.push({ type: "del", key: key });
         }
      }
      await this.batch(batchs);
   }
   /**
  * 
  * @param {
  *  {  type : 'del' | 'put' ,  key : string  } , 
  {  type : 'put' ,  key : 'name' ,  value : 'Yuri Irsenovich Kim'  } , 
  {  type : 'put' ,  key : ' dob' ,  value : '16 February 1941'  } , 
  {  type : 'put' ,  key : 'spouse' , 价值: 'Kim Young-sook'  } , 
  {  type : 'put' ,  key : 'occupation' ,  value : 'Clown'  } 
  * } ops 
  * @returns 
  */
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
      await new Promise((resolve) => this.db.batch(ops, DefaultOptions, () => resolve(undefined)));
   }
   async clear(ops) {
      return this.db.clear(ops);
   }
   async close(): Promise<undefined> {
      return new Promise((resolve) => {
         this.db.close(() => setTimeout(() => resolve(undefined), 150));
      });
   }
   async count(key: string, filter?: Filter): Promise<number> {
      let count = 0;
      let startTime = Date.now();
      await this.iterator({ key: key, start: 0, limit: -1, values: false, filter }, async (key, val) => {
         count++;
         //防止超时等待， 超时就返回目前取得的所有数
         if (Date.now() - startTime >= 5 * 1000) return LionDB.Break;
         if (count % 100 === 0) await wait(100);
      });
      return count;
   }
   async find({
      key,
      limit = 100,
      start = 0,
      reverse = false,
      keys = true,
      filter,
   }: {
      key: string;
      limit?: number;
      start?: number;
      values?: boolean;
      reverse?: boolean;
      filter?: Filter;
      keys?: boolean;
   }): Promise<{ key: string; value: any }[] | any[]> {
      let list: any[] = [];
      await this.iterator({ key, limit, start, filter: filter }, (skey, svalue) => {
         if (svalue !== undefined) keys ? list.push({ key: skey, value: svalue }) : list.push(svalue);
      });
      return reverse ? list.reverse() : list;
   }

   async iterator(
      {
         key,
         limit = 100,
         start = 0,
         values = true,
         filter,
      }: {
         key: string;
         limit?: number;
         start?: number;
         values?: boolean;
         filter?: Filter;
      },
      callback: IteratorCallback,
   ): Promise<void> {
      let _this = this;
      let searchKey = String(key).trim();
      let isFuzzy = searchKey.endsWith("*");
      let isSearchAll = searchKey === "*";
      searchKey = isSearchAll ? searchKey : searchKey.replace(/^\*|\*$/g, "");
      if (values === false && filter) values = true;

      let options = Object.assign({}, { key, limit: -1, values: false }, { gte: searchKey });
      let iterator = this.db.iterator(options);

      return new Promise((resolve, reject) => {
         let itSize = 0;
         let itIndex = -1;
         if (!iterator) return resolve();
         iterator.seek(searchKey);
         (function next() {
            iterator.next(async (...args) => {
               let error = args[0],
                  k = args[1],
                  v = args[2];
               if (args.length < 1 || !k || error) {
                  iterator.end((err) => err && console.error("err", err.message));
                  return resolve();
               }
               try {
                  itIndex++;
                  if (start > itIndex) return next();

                  let sKey = String(k);
                  if (!isFuzzy) {
                     if (sKey != searchKey) {
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve();
                     }
                  } else {
                     if (limit > 0 && itSize >= limit) {
                        //如果限制条数， 超出刚好返回
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve();
                     }
                     if (!isSearchAll && !sKey.startsWith(searchKey)) {
                        //不是全局搜索， 发现开头不匹配，返回
                        iterator.end((err) => err && console.error("err", err.message));
                        return resolve();
                     }
                  }
                  if (values === false) {
                     let callbackResult = await callback(sKey);
                     if (callbackResult === LionDB.Break) {
                        iterator.end((err) => err && console.error("err break", err.message));
                        return resolve();
                     }
                     return next();
                  }

                  /*  let res: any = analyzeValue(v);
                  let curTime = Math.ceil(Date.now() / 1000);
                  if (res.ttl > 0 && res.startAt + res.ttl < curTime) {
                     _this.del(sKey);
                     await wait(5);
                  } else {
                     let value = res.value();
                     if (filter) {
                        let v = await filter(value);
                        if (v != true) return next();
                     }
                     itSize++;
                     let callbackResult = await callback(sKey, value);
                     if (callbackResult === LionDB.Break) {
                        iterator.end((err) => err && console.error("err break", err.message));
                        return resolve();
                     }
                  }  */
                  let value = await _this.get(sKey);
                  if (value != undefined) {
                     if (filter) {
                        let v = await filter(value, sKey, {
                           get: async (k) => {
                              return _this.get(k);
                           },
                        });
                        if (v != true) return next();
                     }
                     let callbackResult = await callback(sKey, value);
                     if (callbackResult === LionDB.Break) {
                        iterator.end((err) => err && console.error("err break", err.message));
                        return resolve();
                     }
                     itSize++;
                  }
                  next();
               } catch (err) {
                  console.info("err", err.stack);
                  iterator.end((err) => err && console.error("err", err.message));
                  resolve();
               }
            });
         })();
      });
   }
   getProperty(property: "leveldb.num-files-at-levelN" | "leveldb.stats" | "leveldb.sstables") {
      try {
         return this.db.db.getProperty(property);
      } catch (err) {
         return undefined;
      }
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
