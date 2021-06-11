/**
 *
 * @param array
 */
export default function any(array: Array<Promise<any>>): Promise<any> {
  return new Promise((resolve, reject) => {
    array.forEach(async (p: Promise<any>) => {
      let value = await p.then((r) => r).catch((e) => {});
      if (value != undefined || value != null) resolve(value);
    });
  });
}
