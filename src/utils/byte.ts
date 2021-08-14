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
