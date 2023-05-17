import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12);
/**
 * 创建uuid
 * @param size uuid长度，默认12
 */
export function uuid(size: number = 11) {
   return nanoid(size);
}
let LastIds: Map<string, number> = new Map();
/**
 * 创建增量id
 * @param key 表名，默认用id名
 */
export function sequenceId(key: string = "id"): string {
   let prefix = Math.ceil(Date.now() / 1000).toString(36);
   let lastId = LastIds.get(key) || parseInt("zzz", 36);
   lastId = lastId - 1;
   if (lastId < parseInt("11", 36)) lastId = parseInt("zz", 36) - 1;
   LastIds.set(key, lastId);
   let id = prefix + lastId.toString(36) + uuid(4);
   return id;
}

function to62bit(val: number) {
   let s = Math.floor(val / 62);
}
console.info(sequenceId(), sequenceId().length);

function makePrefix() {
   let date = new Date();
   let yyyy = date.getFullYear();
   let M = date.getMonth().toString(36);
   let D = date.getDate().toString(36);
}
