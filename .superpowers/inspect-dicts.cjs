const fs = require("fs");
for (const f of ["src/lib/i18n/dictionaries/th.ts", "src/lib/i18n/dictionaries/en.ts"]) {
  const t = fs.readFileSync(f, "utf8");
  console.log("===", f);
  console.log("nav catalog:", /catalog: "/.test(t));
  const i = t.indexOf("  catalog: {");
  console.log("catalog section at:", i);
  if (i >= 0) console.log(t.slice(i, i + 400));
}
