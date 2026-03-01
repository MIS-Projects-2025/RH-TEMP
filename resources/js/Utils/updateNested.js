// Generic nested update function in JS
export default function updateNested(obj, path, value) {
  if (!path) return obj; // empty path, return original

  const keys = path.split('.');
  const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
  let temp = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // If key doesn't exist or is not an object/array, create object
    if (temp[key] === undefined || temp[key] === null || typeof temp[key] !== 'object') {
      temp[key] = {};
    } else {
      temp[key] = Array.isArray(temp[key]) ? [...temp[key]] : { ...temp[key] };
    }

    temp = temp[key];
  }

  temp[keys[keys.length - 1]] = value;
  return newObj;
}

// --- Test Cases ---

// 1. Simple nested object
const obj1 = { a: { b: { c: 1 } } };
console.log(updateNested(obj1, "a.b.c", 42)); // { a: { b: { c: 42 } } }

// 2. Adding new nested property
const obj2 = { a: { b: {} } };
console.log(updateNested(obj2, "a.b.d", "new")); // { a: { b: { d: "new" } } }

// 3. Updating top-level property
const obj3 = { x: 10, y: 20 };
console.log(updateNested(obj3, "x", 99)); // { x: 99, y: 20 }

// 4. Creating nested path that doesn’t exist
const obj4 = {};
console.log(updateNested(obj4, "foo.bar.baz", "hello")); // { foo: { bar: { baz: "hello" } } }

// 5. Working with arrays inside objects
const obj5 = { arr: [{ val: 1 }, { val: 2 }] };
console.log(updateNested(obj5, "arr.1.val", 42)); // { arr: [{ val: 1 }, { val: 42 }] }

// 6. Updating array element with new object
const obj6 = { arr: [] };
console.log(updateNested(obj6, "arr.0.foo", "bar")); // { arr: [{ foo: "bar" }] }

// 7. Empty path returns original
const obj7 = { a: 1 };
console.log(updateNested(obj7, "", 999)); // { a: 1 }

// 8. Non-object values in path get overwritten
const obj8 = { a: 1 };
console.log(updateNested(obj8, "a.b.c", 123)); // { a: { b: { c: 123 } } }