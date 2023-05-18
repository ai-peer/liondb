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
   constructor(options: { readonly table: string; readonly indexs: Index[] }) {
      assert(!!Model._app, "app is null");
      assert(!!options.table, "table is null");
      this.table = options.table;
      this.indexs = options.indexs;
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
   /**
    * 生成索引 key
    * @param args
    */
   protected indexKey(...args: string[]) {
      return `t-${this.table}-` + args.join("-");
   }
   /**
    * 生成主key
    * @param id
    */
   protected masterKey(id: string) {
      return this.indexKey("m", id);
   }
   async find(opts: { id?: string; index?: Index; start?: number; limit?: number; filter?: (entity: T, key: string) => Promise<boolean> }): Promise<T[]> {
      let index = opts.index;
      let ids: Set<string> = new Set();
      const filter: any = opts.filter ? opts.filter : () => true;
      let list: T[] = [];
      if (index) {
         await this.indexdb.iterator(
            {
               key: this.indexKey(index.name, ...index.fields) + "*",
               start: opts.start || 0,
               limit: opts.limit || 24,
               filter: async (id, key) => {
                  if (ids.has(id)) return false;
                  let entity = await this.get(id);
                  if (!entity) {
                     this.indexdb.del(key);
                     return;
                  }
                  let check = await filter(entity, key);
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
            filter: async (entity: T, key) => filter(entity, key),
         })) as T[];
      }

      return list;
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
   async save(id: string, data: T): Promise<T> {
      let video = await this.get(id);
      if (video) {
         await this.deleteIndexs(video);
         let masterKey = this.masterKey(id);
         Object.assign(video, data);
         Object.assign(data, video);
         await this.masterdb.set(masterKey, video);
         await this.saveIndexs(video);
         return data;
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
            batchs.push({
               type: "del",
               key: this.indexKey(index.name, ...index.fields.map((key) => item[key]), item.id),
            });
         });
      });
      await this.indexdb.batch(batchs);
      return items;
   }

   get(id: string): Promise<T> {
      return this.masterdb.get(this.masterKey(id));
   }

   async gets(...ids: string[]): Promise<T[]> {
      if (ids.length < 1) return [];
      return this.masterdb.getMany(...ids.map((id) => this.masterKey(id)));
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
