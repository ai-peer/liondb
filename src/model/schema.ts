import assert from "assert";
import { isMap, isNull } from "./helper";
import { Entity, Column, ColumnConfig } from "./orm";
import { Contains, IsInt, Length, IsEmail, IsFQDN, IsDate, Min, Max, IsNotEmpty, IsEmpty, validateSync } from "class-validator";
//import xss from "xss";

const TablesColumn: { [key: string]: { [key: string]: ColumnConfig } } = {};

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
      this.getColumns();
      data && this.reduce(data);
   }
   /**
    * 补丁， 补充内容的缺失字段， 填充默认值，
    * 主要应用在数据入库阶段
    * @param object
    */
   patch(object?: { [key: string]: any }): this {
      object = object || this;
      if (this.hasColumns()) {
         let tableColumns = this.getColumns();
         for (let field in tableColumns) {
            if ("id" === field) continue;
            let value = object[field];
            if (isNull(value) && !isNull(this[field])) continue;
            if (isNull(value)) value = this.getDefaultValue(this.getColumn(field));
            this.updateColumn(field, value);
         }
      } else {
         if (object === this) return this;
         if (!isMap(object)) return this;
         for (let field of Object.keys(object)) {
            if ("id" == field) continue;
            let value = object[field];
            if (isNull(value) && !isNull(this[field])) continue;
            this[field] = value;
         }
      }
      return this;
   }

   /**
    * schema, 清除非定义字段
    * @param object
    * @returns
    */
   reduce(object?: { [key: string]: any }): this {
      object = object || this;
      if (this.hasColumns()) {
         if (!isMap(object)) return this;
         for (let field of Object.keys(object)) {
            let column = this.getColumn(field);
            if (!column) continue;
            this.updateColumn(field, object[field]);
         }
      } else {
         this.updateColumns(object);
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
    * 是否有定义列, 在ts模式下会有, 在编译的js包浏览器直接引用, 会不存在
    * @returns
    */
   hasColumns() {
      let columns = TablesColumn[this.constructor.name];
      return !!columns.id && !!columns.createAt;
   }
   /**
    * 是否是定义的字段
    * @param name
    * @returns
    */
   getColumn(name: string): ColumnConfig {
      let columns = TablesColumn[this.constructor.name];
      return columns[name];
   }
   getColumns(): {
      [key: string]: ColumnConfig;
   } {
      const className = this.constructor.name;
      let columns = TablesColumn[className];
      if (columns) return columns;
      let schema = this["_tablesColumn"].Schema;
      let thisSchema = this["_tablesColumn"][className];
      columns = { ...schema, ...thisSchema };
      TablesColumn[className] = columns;
      return columns;
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
   toColumnValue(field: string, value: any) {
      if (value === undefined || value === null) return;
      if (!this.hasColumns()) return value;
      let column = this.getColumn(field);
      switch (column.type) {
         case "number":
            value = Number(value);
            break;
         case "boolean":
            value = Boolean(value);
            break;
         case "date":
            value = value instanceof Date ? value : new Date(value);
            break;
         case "array":
            value = value instanceof Array ? value : [value];
            break;
         case "map":
            let tf = typeof value;
            if (tf == "object") {
               if (value instanceof Array) {
                  value = Object.create({});
               }
            } else value = Object.create({});
            value = Object.keys(value).length > 0 ? value : Object.create({});
         default:
            value = String(value).trim();
            break;
      }
      return value;
   }
   updateColumns(updateData: { [Key: string]: any }) {
      if (!isMap(updateData)) return;
      for (let field of Object.keys(updateData)) {
         this.updateColumn(field, updateData[field]);
      }
   }
   updateColumn(field: string, value: any) {
      if (/^_{1,}/.test(field)) return value;
      value = typeof value === "function" ? value(this[field]) : value;
      if (this.hasColumns()) {
         this[field] = this.toColumnValue(field, value);
      } else {
         this[field] = value;
      }
      return this[field];
   }
}
function errorCheck(tableName: string, list: any[]) {
   let p: any[] = [];
   for (let item of list) {
      for (let key in item.constraints || {}) p.push(item.constraints[key]);
   }
   return tableName + "=>" + p.join(", ");
}
