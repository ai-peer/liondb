import crypto from "crypto";
import { machineId, machineIdSync } from "node-machine-id";
import fs from "fs";
import path from "path";
/**
 * md5
 * @param {string} value
 * @returns
 */
export function md5(value): string {
   var md5 = crypto.createHash("md5");
   var result = md5.update(value.toString()).digest("hex");
   return result.toUpperCase();
}

/**
 * 创建机器编码
 */
export function device() {
   return md5(machineIdSync());
}
export function string2Bit(value, length = 6) {
   value = value.substring(0, length);
   return value.split("").map((v) => v.charCodeAt(0));
}
/**
 *
 * @param {number} max
 * @returns
 */
export function random2Int(max) {
   return Math.floor(Math.random() * (max + 1));
}

export function cycle(interval = 5, handle) {
   interval = Math.max(interval, 1);
   let thread;
   (function _cycle() {
      thread = setTimeout(() => {
         try {
            handle && handle();
            _cycle();
         } catch (e) {}
      }, interval * 1000);
   })();
   return {
      stop() {
         clearTimeout(thread);
      },
   };
}
export function isDev() {
   return process.env.NODE_ENV == "development";
}
/**
 *
 * @param {Buffer} buffer
 * @param {number | undefined} limit
 * @returns
 */
export function buffer2array(buffer, limit) {
   let ret: any[] = [];
   let max = limit ? limit : buffer.length;
   max = Math.min(max, buffer.length);
   for (let i = 0; i < max; i++) {
      ret.push(buffer[i]);
   }
   return ret;
}

export function mkdirs(dir) {
   if (!fs.existsSync(dir)) {
      try {
         fs.mkdirSync(dir);
      } catch (err) {
         let par = dir.replace(/[\/\\][^\/\\]+$/, "");
         mkdirs(par);
         fs.mkdirSync(dir);
      }
   }
}
