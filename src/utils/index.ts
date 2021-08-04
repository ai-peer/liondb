import crypto from "crypto";
import { machineId, machineIdSync } from "node-machine-id";

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
 * 整型转字节
 * @param {number} value 值
 * @param length 长度,单位字节, 最大为6,
 */
export function int2Bit(value, length = 6) {
   const max = 6;
   let s = Array(max);
   value = Math.floor(value % 281474976710656); //  Math.pow(2, 48)
   let high = Math.floor(value / Math.pow(2, 32));
   let low = Math.floor(value % Math.pow(2, 32));
   for (let i = max - 1; i >= 0; i--) {
      if (i >= 2) {
         s[i] = (low >> ((max - i - 1) * 8)) & 0xff;
      } else {
         s[i] = (high >> (((max - i - 1) % 4) * 8)) & 0xff;
      }
   }
   /*   s[0] = (high >> 8) & 0xff;
  s[1] = (high >> 0) & 0xff;
  s[2] = (low >> 24) & 0xff;
  s[3] = (low >> 16) & 0xff;
  s[4] = (low >> 8) & 0xff;
  s[5] = (low >> 0) & 0xff; */
   return s.slice(max - Math.min(length, max));
}

/**
 *
 * @param {Buffer | Array<number>} value
 * @returns
 */
export function bit2Int(value) {
   let max = 6;
   value = value.slice(Math.max(value.length - max, 0));
   let result = 0;
   let low = 0,
      high = 0;
   for (let i = 0; i < value.length; i++) {
      let move = (value.length - i - 1) * 8;
      let v = value[i];
      if (move >= 32) {
         high += Math.pow(2, 32) * (v << move % 32);
      } else if (move <= 24) {
         low += move == 24 ? v * Math.pow(2, 24) : v << move;
      }
   }
   result = high + low;
   return result;
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
