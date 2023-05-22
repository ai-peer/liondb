import assert from "assert";
import { Entity, Column, ColumnConfig } from "./orm";
import { Contains, IsInt, Length, IsEmail, IsFQDN, IsDate, Min, Max, IsNotEmpty, IsEmpty, validateSync } from "class-validator";
//import xss from "xss";
export default class Schema {
   private static readonly _columns: { [key: string]: ColumnConfig } = Object.create({});
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
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      if (!tableColumns.id) {
         if (object === this) return this;
         for (let key of Object.keys(object)) {
            let val = object[key];
            if (val != undefined && val != null) this[key] = val;
         }
         return this;
      } else if (typeof object === "object") {
         for (let key in tableColumns) {
            let column = tableColumns[key];
            this.updateColumnValue({ column, field: key, updateData: object });
         }
      }
      return this;
   }

   toColumnValue(field: string, val: any) {
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      let column = tableColumns[field];
      if (!column) return val;
      if (column.type == "date") {
         val = new Date(val);
      } else if (typeof val === "string") {
         val = val.trim();
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
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      if (!tableColumns.id) {
         if (object === this) return this;
         for (let key of Object.keys(object)) {
            let val = object[key];
            if (val != undefined && val != null) this[key] = val;
         }
         return this;
      } else if (typeof object === "object") {
         //let entityColumns = this["_entityColumns"];
         for (let key of Object.keys(object)) {
            //let val = object[key];
            let column = this.getColumn(key); //entityColumns[key];
            if (!column) continue;
            this.updateColumnValue({ column, field: key, updateData: object });
         }
      }
      return this;
   }
   /*    xss(fieldName: string) {
      let v = this[fieldName];
      return typeof v === "string" ? xss(this[fieldName]) : v;
   } */
   /**
    * 字段是否处理xss脚本， 默认都有， 不需要的话，要在@Column({xss: false}) 指定
    * @param fieldName
    * @returns
    */
 /*   isXss(fieldName: string) {
      let tableColumns = this.getColumns(); // this["_entityColumns"];
      let column = tableColumns[fieldName];
      return column?.xss != false;
   }
 */
   /**
    * 是否是定义的字段
    * @param name
    * @returns
    */
   getColumn(name: string): ColumnConfig {
      /*    let tableName = this.constructor.name;
      let map = this["_tableColumn"][tableName] || {};
      let schemaMap = this["_tableColumn"]["Schema"];
      return map[name] || schemaMap[name]; */
      let columns = this.constructor["_columns"];
      return columns[name];
   }
   getColumns(): {
      [key: string]: ColumnConfig;
   } {
      //let tableName = this.constructor.name;
      //let map = this["_tableColumn"][tableName];
      //let schemaMap = this["_tableColumn"]["Schema"];
      //return { ...schemaMap, ...map };
      let columns = this.constructor["_columns"];
      return { ...columns };
   }
   /**
    * 是不是列
    * @param name
    * @returns
    */
   isColumn(name: string) {
      return !!this.getColumn(name);
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
   /**
    * 获取列默认值
    * @param column
    * @returns
    */
   getDefaultValue(column: ColumnConfig) {
      return typeof column.default === "function" ? column.default(this) : column.default;
   }
   updateColumnValue({ column, field, updateData }: { column: ColumnConfig; field: string; updateData: any }) {
      let value = updateData[field];
      if (value === undefined || value === null) value = this.getDefaultValue(column);
      if (typeof value === "function") value = value(this[field]);
      if (value != undefined && value != null && !/^_{1,}/.test(field)) {
         if (column.type == "date") {
            value = value instanceof Date ? value : new Date(value);
         } else if (typeof value === "string") {
            value = value.trim();
         }
         if (typeof column.format === "function") {
            let v = column.format(value, { update: updateData, row: this });
            if (!(v === undefined || v === null)) value = v;
         }
         this[field] = handleValue(column, value);
      }
   }
}
function errorCheck(tableName: string, list: any[]) {
   let p: any[] = [];
   for (let item of list) {
      for (let key in item.constraints || {}) p.push(item.constraints[key]);
   }
   return tableName + "=>" + p.join(", ");
}

function handleValue(column: ColumnConfig, val: any) {
   //return typeof val === "string" && column?.xss == true ? xss(val) : val;
   return val;
}
