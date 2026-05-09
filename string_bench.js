const str = "hello \n  world\n\n\ntest".repeat(100);

const s1 = performance.now();
for (let i = 0; i < 10000; i++) {
  str.replace(/(?:\n\s*){3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}
const e1 = performance.now();

const s2 = performance.now();
for (let i = 0; i < 10000; i++) {
  str.trim();
}
const e2 = performance.now();

console.log("Original:", e1 - s1);
console.log("Trim only:", e2 - s2);
