import { createModel } from "./db";
import LionDB, { Filter } from "../index";
import assert from "assert";
import Schema from "./schema";
import { validateSync } from "class-validator";
import { uuid, uuidSeq, isNull, isMap } from "./helper";

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
      this.checkDefine();
      this.initDB();
   }
   static setApp(app: string) {
      Model._app = app;
   }
   static get app() {
      return Model._app;
   }
   /**
    * 检测定义是否合法
    */
   private checkDefine() {
      let instance: T = new this.SchemaClass();
      const schemaName = instance.constructor.name;
      instance.patch();
      this.indexs.forEach((item) => {
         assert.ok(typeof item.name === "string", `index name type must be a string`);
         for (let field of item.fields) {
            let column = instance.getColumn(field);
            let val = instance[field];
            //let type = typeof val;
            //assert.ok(val != undefined && val != null, `Defined index fields[${schemaName}.${field}] must set default values`);
            assert.ok(["string", "number"].includes(column.type), `Define the index field[${schemaName}.${field}] type to only allow [string, number]`);
            //assert.ok(["string", "number"].includes(type), `Define index field[${schemaName}.${field}] values ​​only allow [string, number]`);
         }
      });
   }
   /**
    * 初始化数据库
    * @returns
    */
   private async initDB() {
      let instance: T = new this.SchemaClass();
      instance.patch();
      const sysId = "0000zzzz";
      let entity = await this.indexdb.get(sysId);
      if (entity === null || entity === undefined) {
         //不存在
         entity = new this.SchemaClass();
         if (entity.hasColumns()) {
            let columns = instance.getColumns();
            for (let field in columns) {
               let column = columns[field];
               if (typeof column.index === "function") {
                  let val = column.index(instance[field] || "0") || "";
                  entity[field] = val;
               }
            }
         }
         await this.indexdb.set(sysId, entity);
         return;
      }
      let columns = instance.getColumns();
      const changeIndexs: Set<string> = new Set();
      for (let field in columns) {
         let column = columns[field];
         if (typeof column.index === "function") {
            let v0 = entity[field];
            let v1 = column.index(instance[field]);
            if (v0 != v1) {
               entity[field] = v1;
               //生成索引方式发生变更, 必须生成新的索引纪录
               changeIndexs.add(field);
            }
         }
      }
      //需要重建索引
      if (changeIndexs.size > 0) {
         await this.indexdb.clear();
         let start = Date.now();
         let count = 0;
         console.info(`============= start rebuild index[${this.table}] =============`);
         //创建新索引
         await this.masterdb.iterator(
            {
               key: this.masterKey("") + "*",
            },
            async (key, item) => {
               count++;
               await this.saveIndexs(item);
            },
         );
         let ttl = Math.ceil((Date.now() - start) / 1000);
         let h = Math.floor(ttl / 3600);
         let m = Math.floor((ttl % 3600) / 60);
         let s = ttl % 60;
         console.info(`============= end rebuild index[${this.table}] ok =============`);
         console.info(`============= total=${count} ttl=${h}:${m}:${s} =============`);
      }
      await this.indexdb.set(sysId, entity);
   }
   protected toSchema(data: { [key: string]: any }): T {
      return !!data ? new this.SchemaClass(data) : undefined;
   }
   /**
    * 生成索引 key
    * @param args
    */
   protected indexKey(indexName: string, ...args: string[]) {
      args = args.filter((v) => !!v);
      //return `t-${this.table}-${indexName}-` + args.join("-");
      return `t-${indexName}-` + args.join("-");
   }
   /**
    * 生成主key
    * @param id
    */
   protected masterKey(id: string) {
      return this.indexKey("m", id);
   }

   async get(id: string): Promise<T> {
      let t = await this.masterdb.get(this.masterKey(id));
      return this.toSchema(t);
   }

   async gets(...ids: string[]): Promise<T[]> {
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
      const hasFilter = typeof opts.filter === "function";
      if (index) {
         await this.indexdb.iterator(
            {
               key: this.indexKey(index.name, ...index.fields) + "*",
               limit: -1,
            },
            async (key, id) => {
               if (!id) {
                  this.indexdb.del(key);
                  return;
               }
               if (!hasFilter) {
                  count++;
                  return;
               }
               let entity = await this.get(id);
               if (!entity) {
                  this.indexdb.del(key);
                  return;
               }
               let check = hasFilter && opts.filter ? await opts.filter(entity, key) : true;
               if (check) count++;
            },
         );
      } else {
         await this.masterdb.iterator(
            {
               key: this.masterKey(opts.id || "") + "*",
               limit: -1,
               values: hasFilter,
            },
            async (key, entity) => {
               if (hasFilter && !entity) {
                  this.masterdb.del(key);
                  return;
               }
               let check = hasFilter && opts.filter ? await opts.filter(entity, key) : true;
               check && count++;
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
      filter?: (entity: T, key: string) => boolean | Promise<boolean>;
   }): Promise<T[]> {
      let index = opts.index;
      const limit = opts.limit || 24;
      const reverse = opts.reverse != false ? true : false;
      let ids: Set<string> = new Set();
      let list: T[] = [];
      const hasFilter = typeof opts.filter === "function";
      if (index) {
         await this.indexdb.iterator(
            {
               key: this.indexKey(index.name, ...index.fields) + "*",
               start: opts.start || 0,
               limit: -1, //opts.limit || 24,
               reverse: reverse,
            },
            async (key, id) => {
               if (ids.size >= limit) return "break";
               if (!id) {
                  this.indexdb.del(key);
                  return;
               }
               if (ids.has(id)) return;
               let entity = await this.get(id);
               if (!entity) {
                  this.indexdb.del(key);
                  return;
               }
               let check = hasFilter && opts.filter ? await opts.filter(entity, key) : true;
               if (check) {
                  ids.add(id);
                  list.push(entity);
               }
               if (ids.size >= limit) return "break";
            },
         );
         //list = await this.gets(...ids);
         return list;
      } else {
         await this.masterdb.iterator(
            {
               key: this.masterKey(opts.id || "") + "*",
               start: opts.start || 0,
               limit: -1,
            },
            async (key, entity) => {
               if (list.length >= limit) return "break";
               if (!entity) {
                  this.masterdb.del(key);
                  return;
               }
               let check = hasFilter && opts.filter ? await opts.filter(entity, key) : true;
               check && list.push(entity);
               if (list.length >= limit) return "break";
            },
         );
      }

      return list.map((v) => this.toSchema(v));
   }
   async findOne(opts: { id?: string; index?: Index; start?: number; limit?: number; filter?: (entity: T, key: string) => Promise<boolean> }): Promise<T | undefined> {
      let list = await this.find(opts);
      return list[0];
   }
   async insert(data: T): Promise<T> {
      if (!data.id) data.id = uuidSeq();
      data = data instanceof this.SchemaClass ? data : this.toSchema(data);
      this.patch(data, data);
      data.valid();
      const id = data.id;
      let masterKey = this.masterKey(id);
      data.updateAt = data.updateAt || new Date();
      //ttl = ttl > 0 ? ttl : 0;
      await this.masterdb.set(masterKey, data);
      await this.saveIndexs(data);
      return data;
   }
   /**
    * 保存数据
    * @deprecated
    * @param data
    * @param ttl
    */
   async create(data: T): Promise<T> {
      return this.insert(data);
   }
   /**
    * 更新数据
    * @param id
    * @param data
    * @returns
    */
   async update(id: string, data: { [key: string]: any }): Promise<T> {
      let video = await this.get(id);
      if (!video) return video;
      await this.deleteIndexs(video);
      let masterKey = this.masterKey(id);
      this.patch(video, data);
      video.updateAt = new Date();
      await this.masterdb.set(masterKey, video);
      await this.saveIndexs(video);
      return video;
   }
   /**
    * 保存数据, 不存在就插入新的
    * @param data
    * @param ttl
    */
   async save(id: string, data: { [key: string]: any }): Promise<T> {
      let video = await this.get(id);
      if (video) {
         video.id = id;
         await this.deleteIndexs(video);
         let masterKey = this.masterKey(id);
         this.patch(video, data);
         video.updateAt = new Date();
         await this.masterdb.set(masterKey, video);
         await this.saveIndexs(video);
         return video;
      } else {
         data.id = id;
         return this.insert(this.toSchema(data));
      }
   }
   /**
    * 删除字段信息
    * @param id
    * @param indexs
    */
   async delete(...ids: string[]) {
      let list: T[] = [];
      for (let id of ids) {
         let item = await this.deleteIndexs(id);
         list.push(item);
      }
      let masterKeys: string[] = ids.map((id) => this.masterKey(id));
      await this.masterdb.del(...masterKeys);
      return list;
   }
   /**
    * 保存索引
    * @param data
    * @param ttl
    */
   protected async saveIndexs(data: T, indexs: Index[] = []) {
      data = data instanceof this.SchemaClass ? data : new this.SchemaClass(data);
      indexs = indexs.length < 1 ? this.indexs : indexs;
      const id = data.id;
      let batchs: { type: "put"; key: string; value: any; ttl: number }[] = [];
      indexs.forEach((index) => {
         let vals = index.fields.map((v) => {
            let column = data.getColumn(v);
            if (!column) throw new Error(`[${data.constructor.name}][${v}] is not exist`);
            let rv = data[v];
            if (typeof column.index == "function") rv = column.index(rv) || rv;
            return rv;
         });
         if (vals.length > 0) {
            batchs.push({
               type: "put",
               key: this.indexKey(index.name, ...vals, id),
               value: id,
               ttl: 0,
            });
         }
      });
      await this.indexdb.batch(batchs);
   }

   protected async deleteIndexs(id: string | T, indexs: Index[] = []) {
      indexs = indexs.length < 1 ? this.indexs : indexs;
      let item: T = typeof id === "string" ? await this.get(id) : id;
      if (!item) return item;
      //let items = await this.gets(...ids.filter((v) => typeof v === "string"));
      let batchs: { type: "del"; key: string }[] = [];
      this.indexs.forEach((index) => {
         //let vals = index.fields.map((v) => item[v]);
         let vals = index.fields.map((v) => {
            let column = item.getColumn(v);
            if (!column) throw new Error(`[${item.constructor.name}][${v}] is not exist`);
            let rv = item[v];
            if (typeof column.index == "function") rv = column.index(rv) || rv;
            return rv;
         });
         batchs.push({
            type: "del",
            key: this.indexKey(index.name, ...vals, item.id),
         });
      });
      await this.indexdb.batch(batchs);
      return item;
   }

   async clear() {
      let isDev = process.env.NODE_ENV == "development";
      if (!isDev) {
         console.warn(`The database can only be cleared in development mode`);
         return;
      }
      this.masterdb.clear();
      this.indexdb.clear();
   }

   private patch(target: T, updateData: { [key: string]: any }): Schema {
      if (!updateData) return target;
      updateData = updateData || target;
      if (typeof updateData != "object") return target;
      if (target.hasColumns()) {
         let tableColumns = target.getColumns();
         for (let field in tableColumns) {
            if ("id" === field) continue;
            let value = updateData[field];
            if (isNull(value) && !isNull(target[field])) continue;
            let column = target.getColumn(field);
            if (isNull(value)) value = target.getDefaultValue(column);
            //输入格式化
            if (column.format) value = column.format(value, { row: target, update: updateData });
            target.updateColumn(field, value);
         }
      } else {
         if (updateData === target) return target;
         if (!isMap(updateData)) return target;
         for (let field of Object.keys(updateData)) {
            if ("id" == field) continue;
            let val = updateData[field];
            if (!isNull(val)) target[field] = val;
         }
      }
      return target;
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
