export default function exp(query: { [key: string]: any }, value, symbol: "$lt" | "$lte" | "$gt" | "$gte" | "$ne" | "$equal" | string = "$equal") {
   let size = 0;
   let isTrue = false;
   if (isUnitType(value)) return false;
   for (let k in query) {
      if (/^[$]/.test(k)) {
         isTrue = exp(query[k], value, k);
         if (!isTrue) return false;
         continue;
      }
      let v0 = query[k];
      let v1 = value[k];
      //数据库没有存储值
      if (v1 === undefined) {
         isTrue = v0 === undefined;
         if (!isTrue) break;
      }
      size++;
      let type0 = isUnitType(v0);
      let type1 = isUnitType(v1);
      //都是基本类型
      if (type0 && type1) {
         //isTrue = /[*]$/.test(v0) ? String(v1).startsWith(v0.replace(/[*]+$/, "")) : v1 == v0;
         isTrue = matchLike(v0, v1, symbol);
         if (!isTrue) break;
      }

      if (v1 instanceof Array) {
         let v0List = v0 instanceof Array ? v0 : [v0];
         let isTrue0 = false;
         for (let sv of v0List) {
            //if (v1.find((v) => (/[*]$/.test(sv) ? String(v).startsWith(sv.replace(/[*]+$/, "")) : v == sv))) isTrue0 = true;
            if (v1.find((v) => matchLike(sv, v, symbol))) isTrue0 = true;
         }
         isTrue = isTrue0;
      } else if (v0 instanceof Array) {
         let isTrue0 = false;
         //if (v0.find((v) => (/[*]$/.test(v) ? String(v1).startsWith(v.replace(/[*]+$/, "")) : v == v1))) isTrue0 = true;
         if (v0.find((v) => matchLike(v, v1, symbol))) isTrue0 = true;
         isTrue = isTrue0;
      }
   }
   isTrue = size < 1 ? true : isTrue;
   return isTrue;
}
function matchLike(vs, vt, symbol: "$lt" | "$lte" | "$gt" | "$gte" | "$equal" | "$ne" | string = "$equal") {
   vt = String(vt);
   switch (symbol) {
      case "$lt":
         return vs > vt;
      case "$lte":
         return vs >= vt;
      case "$gt":
         return vs < vt;
      case "$gte":
         return vs <= vt;
      case "$ne":
         return vs != vt;
      case "$equal":
      default:
         if (/[*]$/.test(vs)) return vt.startsWith(vs.replace(/[*]+$/, ""));
         if (/^[*]/.test(vs)) return vt.endsWith(vs.replace(/^[*]+/, ""));
         return vs == vt;
   }
}

function isUnitType(val: any) {
   let type = typeof val;
   if (type === "string" || type === "number" || type === "boolean" || type === "bigint") {
      return true;
   }
   return false;
}
