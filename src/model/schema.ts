import assert from "assert";
import { Entity, Column } from "./orm";
import { Contains, IsInt, Length, IsEmail, IsFQDN, IsDate, Min, Max, IsNotEmpty, IsEmpty, validateSync } from "class-validator";
import xss from "xss";
export default class Schema {
   @Column({ column: "id", type: "string" })
   public id: string;

   /**
    * 创建时间
    */
   @IsDate()
   @IsNotEmpty()
   @Column({ column: "createAt", type: "date", default: new Date() })
   createAt: Date;

   /**
    * 更新时间
    */
   @IsDate()
   @IsNotEmpty()
   @Column({ column: "updateAt", type: "date", default: new Date() })
   updateAt: Date;

   constructor(data?: { [key: string]: any }) {
      data && this.reduce(data);
   }

   /**
    * 补丁， 补充内容的缺失字段， 填充默认值，
    * 主要应用在数据入库阶段
    * @param object
    */
   patch(object?: { [key: string]: any }): this {
      object = object || this;
      if (!!globalThis.document) {
         if (object === this) return this;
         for (let key of Object.keys(object)) {
            let val = object[key];
            if (val != undefined && val != null) {
               this[key] = val;
            }
         }
         return this;
      } else if (typeof object === "object") {
         let tableColumns = this.getColumns(); // this["_entityColumns"];
         for (let key in tableColumns) {
            let val = object[key];
            let column = tableColumns[key];
            if (val === undefined || val === null) val = column.default;
            if (val != undefined && val != null && !/^_{1,}/.test(key)) {
               if (column.type == "date") {
                  val = new Date(val);
               } else if (typeof val === "string") {
                  val = val.trim();
               }
               this[key] = handleValue(column, val);
            }
         }
      }
      return this;
   }
   
   toColumnValue(field: string, val: any) {
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      let column = tableColumns[field];
      if (!column) return undefined;
      if (column.type == "date") {
         return new Date(val);
      } else if (column.type == "number") {
         return Number(val);
      } else if (column.type == "array") {
         return val instanceof Array ? val : [val];
      } else if (column.type === "string") {
         return typeof val === "string" ? val.trim() : String(val);
      } else if (column.type === "boolean") {
         return val != "false" && val != "";
      }
      return val;
   }
   /**
    * schema, 清除非定义字段
    * @param object
    * @returns
    */
   reduce(object?: { [key: string]: any }): this {
      //let tableName = this.constructor.name;
      //let TS: any = this.constructor;
      //let res = new TS();
      object = object || this;
      if (!!globalThis.document) {
         if (object === this) return this;
         for (let key of Object.keys(object)) {
            let val = object[key];
            if (val != undefined && val != null) {
               this[key] = val;
            }
         }
         return this;
      } else if (typeof object === "object") {
         //let entityColumns = this["_entityColumns"];
         for (let key in object) {
            let val = object[key];
            let column = this.getColumn(key); //entityColumns[key];
            if (!column) continue;
            if (val === undefined || val === null) val = column.default;
            if (val != undefined && val != null && !/^_{1,}/.test(key)) {
               if (column.type == "date") {
                  val = new Date(val);
               } else if (typeof val === "string") {
                  val = val.trim();
               }
               //res[key] = val;
               this[key] = handleValue(column, val);
            }
         }
      }
      return this;
   }
   xss(fieldName: string) {
      let v = this[fieldName];
      return typeof v === "string" ? xss(this[fieldName]) : v;
   }
   /**
    * 字段是否处理xss脚本， 默认都有， 不需要的话，要在@Column({xss: false}) 指定
    * @param fieldName
    * @returns
    */
   isXss(fieldName: string) {
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      let column = tableColumns[fieldName];
      return column?.xss != false;
   }

   toJSON() {
      let map: { [key: string]: any } = {};
      // let entityColumns = this["_entityColumns"];
      for (let key in this) {
         if (/^_/.test(key)) continue;
         let val: any = this[key];
         let column = this.getColumn(key); //entityColumns[key] || "";
         val = handleValue(column, val);
         if (column && column.type == "date") {
            map[key] = new Date(val).getTime();
         } else {
            map[key] = val;
         }
      }
      return map;
   }
   /**
    * 是否是定义的字段
    * @param name
    * @returns
    */
   protected getColumn(name: string) {
      let tableName = this.constructor.name;
      let map = this["_tableColumn"][tableName] || {};
      let schemaMap = this["_tableColumn"]["Schema"];
      return map[name] || schemaMap[name];
   }
   protected getColumns(): {
      [key: string]: {
         column: string;
         type: "date" | "string" | "boolean" | "number" | "array" | "map";
         default?: any;
         xss: boolean;
      };
   } {
      let tableName = this.constructor.name;
      let map = this["_tableColumn"][tableName];
      let schemaMap = this["_tableColumn"]["Schema"];
      return { ...schemaMap, ...map };
   }
   /**
    * 是不是字段
    * @param name
    * @returns
    */
   isField(name: string) {
      return !!this.getColumns()[name];
   }
   /**
    * 定义字段列表
    */
   getFields(): string[] {
      let list: string[] = [];
      for (let key in this.getColumns()) {
         list.push(key);
      }
      return list;
   }

   valid() {
      let checks = validateSync(this);
      if (checks.length < 1) return true;
      assert.ok(checks.length < 1, errorCheck(this.constructor.name, checks));
      return false;
   }
}
function errorCheck(tableName: string, list: any[]) {
   let p: any[] = [];
   for (let item of list) {
      for (let key in item.constraints || {}) p.push(item.constraints[key]);
   }
   return tableName + "=>" + p.join(", ");
}
export function setObject(object?: Object) {
   if (typeof object === "object") {
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      for (let key in tableColumns) {
         let val = object[key];
         let column = tableColumns[key];
         if (val === undefined || val === null) val = column.default;
         if (val != undefined && val != null && !/^_{1,}/.test(key)) {
            if (column.type == "date") {
               val = new Date(val);
            } else if (typeof val === "string") {
               val = val.trim();
            }
            this[key] = handleValue(column, val);
         }
      }
   }
}
function handleValue(column, val) {
   return typeof val === "string" && column?.xss != false ? xss(val) : val;
}
/* @Entity
class Us extends Schema {
   @Column({ column: "name", type: "string" })
   name: string;

   @Column({ column: "name", type: "number" })
   age: number;

   constructor(data?) {
      super(data);
   }
}
let u = {
   name: "asdf",
   tree: "tree",
};
let us = new Us(u);
let us1 = new Us();
console.info("-===v", us, us1.tidy(u));
 */
