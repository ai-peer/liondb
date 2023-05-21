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
   /** 列名 */
   column: string;
   /** 类型 */
   type: "date" | "string" | "boolean" | "number" | "array" | "map";
   /** 默认值 */
   default?: string | Array<any> | number | boolean | object | HandleDefault;
   /** 处理跨站脚本攻击 */
   xss: boolean;
   /**
    * 格式输入值
    * @param val
    * @returns
    */
   format?: (val: any, target?: any) => any;
   [key: string]: any;
};
const TableColumn: { [key: string]: ColumnConfig } = {};
export function Column(config: ColumnConfig | object, name: string | void) {
   let conf: any = {};
   if (arguments.length == 1) {
      conf = { ...config };
      let r: any = (target, name) => {
         conf.column = conf.column || name;
         handle(target, name);
      };
      return r;
   } else {
      conf = {
         column: name,
         type: "string",
      };
      handle(arguments[0], name);
   }
   function handle(target, name) {
      TableColumn[target.constructor.name] = TableColumn[target.constructor.name] || [];
      TableColumn[target.constructor.name][name] = conf;
      target._tableColumn = TableColumn;
   }
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
