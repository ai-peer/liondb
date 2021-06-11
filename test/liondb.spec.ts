import assert from "assert";
import LionDB from "../src/index";
let db = new LionDB("./a.db");

beforeEach(async function() {
  await db.del("aa");
  await db.set("aa", { name: "li lei" });
});

describe("比较取值", function() {
  it("比较取值是否相等", async function() {
    const vv = await db.get("aa");
    assert.deepStrictEqual(vv.name, "li lei");
  });
 
});
