/** @format
 *
 * 缓存注解
 *
 */

export function Entity(constructor: Function) {
   Object.seal(constructor);
   Object.seal(constructor.prototype);
}
type HandleDefault = (target) => any;

export type ColumnConfig = {
   type: "date" | "string" | "boolean" | "number" | "array" | "map";
   /** 列名 */
   column?: string;
   /** 类型 */
   /** 处理跨站脚本攻击 */
   //xss?: boolean;
   /**
    * 格式输入值
    * @param value 输入的值
    * @param data
    * @param data.row 数据库里的值(行纪录),只有在更新时才有
    * @param data.update 要更新的的值(行对象),只有在更新时才有
    * @returns 返回入库的值
    */
   format?: (value: any, db: { row?: any; update: any }) => any;

   /** 默认值 */
   default?: string | Array<any> | number | boolean | object | HandleDefault;
   /**
    * 字段索引值生成
    * @param val 值
    * @param target 数据对象
    * @returns
    */
   index?: (val: any) => string;
   [key: string]: any;
};
const TablesColumn: { [key: string]: { [key: string]: ColumnConfig } } = {};
/* const CacheTablesColumn: { [key: string]: { [key: string]: ColumnConfig } } = {};
export function getColumns(className: string) {
   let columns = CacheTablesColumn[className];
   if (columns) return columns;

   let schema = TablesColumn.Schema;
   let tableSchema = TablesColumn[className];
   let allSchema = { ...schema, ...tableSchema };
   CacheTablesColumn[className] = allSchema;
   return allSchema;
} */
export function Column(config: ColumnConfig) {
   //, name: string | void
   let columnConfig: ColumnConfig = {} as any;
   function handle(target, name) {
      columnConfig.type = (columnConfig.type || "string").toLowerCase() as any;
      TablesColumn[target.constructor.name] = TablesColumn[target.constructor.name] || Object.create({});
      TablesColumn[target.constructor.name][name] = columnConfig;
      target._tablesColumn = TablesColumn;
      /*      columnConfig.type = (columnConfig.type || "string").toLowerCase() as any;
      target.constructor._columns = target.constructor._columns || Object.create({});
      target.constructor._columns[name] = columnConfig; */
   }
   columnConfig = { ...config } as any;
   let r: any = (target, name: string) => {
      columnConfig.column = columnConfig.column || name;
      handle(target, name);
   };
   return r;
}
/* function getFormat(target: any, propertyKey: string) {
   console.info("getFormat", target, propertyKey)
   return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
} */

/**
 * 判断是不是一个类
 * @param obj
 * @param strict
 */
function isClass(obj, strict = true) {
   if (typeof obj != "function") return false;

   var str = obj.toString();

   // async function or arrow function
   if (obj.prototype === undefined) return false;
   // generator function or malformed definition
   if (obj.prototype.constructor !== obj) return false;
   // ES6 class
   if (str.slice(0, 5) == "class") return true;
   // has own prototype properties
   if (Object.getOwnPropertyNames(obj.prototype).length >= 2) return true;
   // anonymous function
   if (/^function\s+\(|^function\s+anonymous\(/.test(str)) return false;
   // ES5 class without `this` in the body and the name's first character
   // upper-cased.
   if (strict && /^function\s+[A-Z]/.test(str)) return true;
   // has `this` in the body
   if (/\b\(this\b|\bthis[\.\[]\b/.test(str)) {
      // not strict or ES5 class generated by babel
      if (!strict || /classCallCheck\(this/.test(str)) return true;

      return /^function\sdefault_\d+\s*\(/.test(str);
   }

   return false;
}
