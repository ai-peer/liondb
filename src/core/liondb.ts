import { Type, ILionDB } from "../types";
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
   async count(key: string): Promise<number> {
      let count = 0;
      await this.iterator({ key: key, start: 0, limit: -1, values: false, keys: false }, () => count++);
      return count;
   }
   async find({ key, limit = 100, start = 0 }: { key: string; limit?: number; start?: number }): Promise<{ key: string; value: any }[]> {
      let list: { key: string; value: any }[] = [];
      //let opt = typeof key === "string" ? { key: key } : key;
      await this.iterator({ key, limit, start }, (skey, svalue) => {
         svalue !== undefined && list.push({ key: skey, value: svalue });
      });
      return list;
   }
   async iterator(
      { key, limit = 100, start = 0, keys = true, values = true }: { key: string; limit?: number; start?: number; keys?: boolean; values?: boolean },
      callback,
   ): Promise<undefined> {
      let _this = this;
      let searchKey = String(key).trim();
      let isFuzzy = searchKey.endsWith("*");
      searchKey = searchKey === "*" ? searchKey : searchKey.replace(/^\*|\*$/g, "");
      let options = Object.assign({}, { key, limit: start + limit, values }, { gte: searchKey });
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
               if (start > itIndex) return next();
               if (!values) {
                  let callbackResult = await callback();
                  if (callbackResult === LionDB.Break) {
                     iterator.end((err) => err && console.error("err break", err.message));
                     return resolve(undefined);
                  }
                  return next();
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
                     let callbackResult = await callback(sKey, res.value());
                     if (callbackResult === LionDB.Break) {
                        iterator.end((err) => err && console.error("err break", err.message));
                        return resolve(undefined);
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
