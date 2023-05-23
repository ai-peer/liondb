import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 9);
/**
 * 创建uuid
 * @param size uuid长度，默认12
 */
export function uuid(size: number = 9) {
   return nanoid(size);
}
//let LastIds: Map<string, number> = new Map();
const Max = num62to10("zzz");
let lastSeq = Max;

/**
 * 创建uuid, 使用增量方式创建
 */
export function uuidSeq(): string {
   let date = new Date();
   let prefix = num10to62(Math.ceil(Date.now() / 1000));
   lastSeq = lastSeq - 1;
   if (lastSeq < num62to10("111")) lastSeq = Max;
   let id = prefix + num10to62(lastSeq);
   return id;
}

export function isNull(v) {
   return v === undefined || v === null || Number.isNaN(v);
}
export function isMap(v) {
   if (typeof v != "object") return false;
   if (v instanceof Array) return false;
   return true;
}
function num10to62(val: number) {
   var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),
      radix = chars.length,
      qutient = +val,
      arr: string[] = [];
   let mod = 0;
   do {
      mod = qutient % radix;
      qutient = (qutient - mod) / radix;
      arr.unshift(chars[mod]);
   } while (qutient);
   return arr.join("");
}

function num62to10(val: number | string) {
   var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      radix = chars.length,
      number_code = String(val),
      len = number_code.length,
      i = 0,
      origin_number = 0;
   while (i < len) {
      origin_number += Math.pow(radix, i++) * chars.indexOf(number_code.charAt(len - i) || "0");
   }
   return origin_number;
}

function makePrefix() {
   let date = new Date();
   let yyyy = date.getFullYear();
   let M = date.getMonth().toString(36);
   let D = date.getDate().toString(36);
}
