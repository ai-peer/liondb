/**
 *
 * @param {Array<Promise<any>>} array
 * @returns Promise<any>
 */
module.exports = function any(array) {
   return new Promise((resolve, reject) => {
      array.forEach(async (p) => {
         let value = await p.then((r) => r).catch((e) => {});
         if (value != undefined || value != null) resolve(value);
      });
   });
};
