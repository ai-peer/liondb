import LionDB from "../src";

const liondb = new LionDB("../_local/4");
liondb.on("open", () => {
   console.info("open====");
});
