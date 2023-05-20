import { createModel } from "./db";
import LionDB, { Filter } from "../index";
import assert from "assert";
import Schema from "./schema";
import { validateSync } from "class-validator";
import { uuid, uuidSeq } from "./helper";

export type Index = {
   name: string;
   fields: string[];
};

export class Model<T extends Schema> {
   private static _app: string;
   //static createSchema = createModel;
   readonly masterdb: LionDB;
   readonly indexdb: LionDB;
   readonly table: string;
   readonly indexs: Index[];
   private SchemaClass;

   /**
    * 构造
    * @param opts
    * @param opts.table 表名
    * @param opts.indexs 索引
    * @param opts.SchemaClass Schema类
    */
   constructor(opts: { readonly table: string; readonly indexs: Index[]; readonly SchemaClass }) {
      assert(!!Model._app, "app is null");
      assert(!!opts.table, "table is null");
      this.SchemaClass = opts.SchemaClass;
      this.table = opts.table;
      this.indexs = opts.indexs;
      const { masterdb, indexdb } = createModel(Model._app, this.table);
      this.masterdb = masterdb;
      this.indexdb = indexdb;
   }
   static setApp(app: string) {
      Model._app = app;
   }
   static get app() {
      return Model._app;
   }
   protected toSchema(data: { [key: string]: any }): T {
      return !!data ? new this.SchemaClass(data) : undefined;
   }
   /**
    * 生成索引 key
    * @param args
    */
   protected indexKey(...args: string[]) {
      args = args.filter((v) => !!v);
      return `t-${this.table}-` + args.join("-");
   }
   /**
    * 生成主key
    * @param id
    */
   protected masterKey(id: string) {
      return this.indexKey("m", id);
   }

   async get(id: string): Promise<T | undefined> {
      let t = await this.masterdb.get(this.masterKey(id));
      return this.toSchema(t);
   }

   async gets(...ids: string[]): Promise<(T | undefined)[]> {
      if (ids.length < 1) return [];
      let list = await this.masterdb.getMany(...ids.map((id) => this.masterKey(id)));
      return list.map((v) => this.toSchema(v));
   }
   /**
    * 统计
    * @param opts
    * @param opts.id: 根据主键id查询
    * @param opts.index: 根据自定义索引查询
    * @param opts.filter: 查询过滤方法,异步, async(item, key) => Promise<boolean>
    * @returns
    */
   async count(opts: { id?: string; index?: Index; filter?: (entity: T, key: string) => Promise<boolean> }): Promise<number> {
      let count = 0;
      let index = opts.index;
      let ids: Set<string> = new Set();
      if (index) {
         await this.indexdb.iterator(
            {
               key: this.indexKey(index.name, ...index.fields) + "*",
               limit: -1,
               filter: async (id, key) => {
                  if (ids.has(id)) return false;
                  if (!opts.filter) return true;
                  let entity = await this.get(id);
                  if (!entity) {
                     this.indexdb.del(key);
                     return false;
                  }
                  let check = await opts.filter(entity, key);
                  return check;
               },
            },
            (k, id) => {
               ids.add(id);
               count++;
            },
         );
      } else {
         await this.masterdb.iterator(
            {
               key: this.masterKey(opts.id || "") + "*",
               limit: -1,
               filter: async (entity, key) => {
                  if (!opts.filter) return true;
                  if (!entity) {
                     this.masterdb.del(key);
                     return false;
                  }
                  let check = await opts.filter(entity, key);
                  return check;
               },
            },
            (k, item) => {
               count++;
            },
         );
      }

      return count;
   }
   /**
    * 查询
    * @param opts
    * @param opts.id: 根据主键id查询
    * @param opts.index: 根据自定义索引查询
    * @param opts.start: 开始位置
    * @param opts.limit: 查询结果限制条数
    * @param opts.reverse: 是否倒序,默认true
    * @param opts.filter: 查询过滤方法,异步, async(item, key) => Promise<boolean>
    * @returns
    */
   async find(opts: {
      id?: string;
      index?: Index;
      start?: number;
      limit?: number; //
      reverse?: boolean;
      filter?: (entity: T, key: string) => Promise<boolean>;
   }): Promise<T[]> {
      let index = opts.index;
      const reverse = opts.reverse != false ? true : false;
      let ids: Set<string> = new Set();
      let list: T[] = [];
      if (index) {
         await this.indexdb.iterator(
            {
               key: this.indexKey(index.name, ...index.fields) + "*",
               start: opts.start || 0,
               limit: opts.limit || 24,
               reverse: reverse,
               filter: async (id, key) => {
                  if (ids.has(id)) return false;
                  let entity = await this.get(id);
                  if (!entity) {
                     this.indexdb.del(key);
                     return false;
                  }
                  let check = opts.filter ? await opts.filter(entity, key) : true;
                  if (check) list.push(entity);
                  return check;
               },
            },
            (k, id) => {
               ids.add(id);
            },
         );
         //list = await this.gets(...ids);
         return list;
      } else {
         list = (await this.masterdb.find({
            key: this.masterKey(opts.id || "") + "*",
            start: opts.start || 0,
            limit: opts.limit || 24,
            reverse: reverse,
            filter: async (entity, key) => {
               if (!opts.filter) return true;
               if (!entity) {
                  this.masterdb.del(key);
                  return false;
               }
               let check = await opts.filter(entity, key);
               return check;
            },
         })) as T[];
      }

      return list.map((v) => this.toSchema(v));
   }
   async findOne(opts: { id?: string; index?: Index; start?: number; limit?: number; filter?: (entity: T, key: string) => Promise<boolean> }): Promise<T | undefined> {
      let list = await this.find(opts);
      return list[0];
   }
   /**
    * 保存数据
    * @param data
    * @param ttl
    */
   async create(data: T): Promise<T> {
      if (!data.id) data.id = uuidSeq();
      data = data instanceof this.SchemaClass ? data : this.toSchema(data);
      data.patch();
      data.valid();
      const id = data.id;
      let masterKey = this.masterKey(id);
      //ttl = ttl > 0 ? ttl : 0;
      await this.masterdb.set(masterKey, data);
      await this.saveIndexs(data);
      return data;
   }
   /**
    * 保存数据
    * @param data
    * @param ttl
    */
   async save(id: string, updateData: { [key: string]: any }): Promise<T> {
      let data = updateData instanceof this.SchemaClass ? (updateData as T) : this.toSchema(updateData);
      let video = await this.get(id);
      if (video) {
         await this.deleteIndexs(video);
         let masterKey = this.masterKey(id);
         video.updateAt = data.updateAt = new Date();
         data.reduce();
         Object.assign(video, data);
         await this.masterdb.set(masterKey, video);
         await this.saveIndexs(video);
         return video;
      } else {
         data.id = id;
         return this.create(data);
      }
   }
   /**
    * 保存索引
    * @param data
    * @param ttl
    */
   async saveIndexs(data: T, ttl: number = 0) {
      const id = data.id;
      let batchs: { type: "put"; key: string; value: any; ttl: number }[] = [];
      this.indexs.forEach((index) => {
         let vals = index.fields.map((v) => data[v]);
         if (vals.length > 0) {
            batchs.push({
               type: "put",
               key: this.indexKey(index.name, ...vals, id),
               value: id,
               ttl: ttl,
            });
         }
      });
      await this.indexdb.batch(batchs);
   }
   /**
    * 删除字段信息
    * @param id
    * @param indexs
    */
   async delete(...ids: string[]) {
      let list = await this.deleteIndexs(...ids);
      let masterKeys: string[] = ids.map((id) => this.masterKey(id));
      await this.masterdb.del(...masterKeys);
      return list;
   }
   async deleteIndexs(...ids: (string | T)[]) {
      let strids = ids.filter((v: any) => {
         return typeof v === "string";
      }) as string[];
      let items = await this.gets(...strids);
      ids.forEach((v) => typeof v != "string" && items.push(v));
      //let items = await this.gets(...ids.filter((v) => typeof v === "string"));
      let batchs: { type: "del"; key: string }[] = [];
      items.forEach((item) => {
         if (!item) return;
         this.indexs.forEach((index) => {
            let vals = index.fields.map((v) => item[v]);
            batchs.push({
               type: "del",
               key: this.indexKey(index.name, ...vals, item.id),
            });
         });
      });
      await this.indexdb.batch(batchs);
      return items;
   }

   valid(data) {
      let checks = validateSync(data);
      if (checks.length < 1) return true;
      assert.ok(checks.length < 1, errorCheck(checks));
   }
}
function errorCheck(list: any[]) {
   let p: any[] = [];
   for (let item of list) {
      for (let key in item.constraints || {}) p.push(item.constraints[key]);
   }
   return p.join(", ");
}
export default Model;
