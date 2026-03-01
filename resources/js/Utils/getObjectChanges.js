
const normalize = v => (v === null || v === undefined ? null : v);
/**
 * Compute changes between original data and edited data.
 *
 * @param {Object} editedRows - Object where keys are row IDs and values are objects of edited fields.
 * @param {Object} originalData - Object where keys are row IDs and values are objects of original fields.
 * @returns {Array} Array of change objects: { rowId, field, before, after }
 */
export default function getObjectChanges(editedRows, originalData) {
  const changes = [];

  function compareObjects(rowId, original, edited, parentField = "") {
    for (const key in edited) {
      const before = original[key];
      const after = edited[key];

      const beforeN = normalize(before);
      const afterN = normalize(after);

      const fieldPath = parentField ? `${parentField}.${key}` : key;

      if (beforeN && typeof beforeN === "object" &&
          afterN && typeof afterN === "object") {
        compareObjects(rowId, beforeN, afterN, fieldPath);
      } else if (beforeN !== afterN) {
        changes.push({ rowId, field: fieldPath, before, after });
      }
      // if (before && typeof before === "object" && after && typeof after === "object") {
      //   compareObjects(rowId, before, after, fieldPath);
      // } else if (before !== after) {
      //   changes.push({ rowId, field: fieldPath, before, after });
      // }
    }
  }

  for (const rowId in editedRows) {
    const original = originalData[rowId] || {};
    const edited = editedRows[rowId];
    compareObjects(rowId, original, edited);
  }

  return changes;
}

// export default function getObjectChanges(editedRows, originalData) {
//   const changes = [];

//   for (const rowId in editedRows) {
//     const original = originalData[rowId] || {};
//     const edited = editedRows[rowId];

//     for (const field in edited) {
//       const before = original[field];
//       const after = edited[field];

//       if (before !== after) {
//         changes.push({
//           rowId,
//           field,
//           before,
//           after,
//         });
//       }
//     }
//   }

//   return changes;
// }

// Example usage:

const originalData = {
  1: { name: "Alice", age: 25 },
  2: { name: "Bob", age: 30 },
};

const editedRows = {
  1: { name: "Alice", age: 26 }, // changed age
  2: { name: "Bob", age: 30 },   // no change
};

console.log(getObjectChanges(editedRows, originalData));
/* Output:
[
  { rowId: "1", field: "age", before: 25, after: 26 }
]
*/
