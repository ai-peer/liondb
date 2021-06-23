const { Transform } = require("stream");

/**
 * stream pipi使用
 * @param {Function} callback (chunk, encoding, callback)
 * @returns Transform
 */
export default function(callback) {
   return new Transform({
      transform(chunk, encoding, cb) {
         callback(chunk, encoding, cb);
      },
   });
}
