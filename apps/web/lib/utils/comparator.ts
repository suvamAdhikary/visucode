// ============================================
// Semantic Comparator
// ============================================
// Handles advanced comparison logic for test execution
// - Ignores order in arrays of arrays (like 3Sum)
// - Supports ANY_OF: expected values

export function semanticCompare(expected: string, actual: string): boolean {
  // 1. Check for ANY_OF
  if (expected.startsWith('ANY_OF:')) {
    const validExpectedList = expected.replace('ANY_OF:', '').split('|');
    return validExpectedList.some((validOption) => {
      return compareNormalized(validOption, actual);
    });
  }

  // 2. Normal comparison
  return compareNormalized(expected, actual);
}

function compareNormalized(expected: string, actual: string): boolean {
  try {
    const parsedExpected = JSON.parse(expected);
    const parsedActual = JSON.parse(actual);

    // If both are arrays, we might need to sort them if order doesn't matter.
    // In many algorithms (like 3Sum), the order of the inner arrays and the outer array doesn't matter.
    // Let's do a deep sort for array of arrays.
    if (Array.isArray(parsedExpected) && Array.isArray(parsedActual)) {
      if (isMatrix(parsedExpected) && isMatrix(parsedActual)) {
        return compareMatricesUnordered(parsedExpected, parsedActual);
      }
      if (isArrayOfNumbers(parsedExpected) && isArrayOfNumbers(parsedActual)) {
        // We only sort if it's explicitly a problem that requires unordered comparison,
        // but for safety, we generally assume array outputs are strictly ordered UNLESS it's a matrix (like 3Sum).
        // Let's stick to strict equality for 1D arrays, except if we want them unordered.
        // For now, strict stringify for 1D arrays.
        return JSON.stringify(parsedExpected) === JSON.stringify(parsedActual);
      }
    }

    return JSON.stringify(parsedExpected) === JSON.stringify(parsedActual);
  } catch {
    // If not valid JSON, compare as trimmed strings
    return expected.trim() === actual.trim();
  }
}

function isMatrix(arr: any[]): boolean {
  return arr.length > 0 && arr.every((item) => Array.isArray(item));
}

function isArrayOfNumbers(arr: any[]): boolean {
  return arr.every((item) => typeof item === 'number');
}

function compareMatricesUnordered(expected: any[][], actual: any[][]): boolean {
  if (expected.length !== actual.length) return false;

  const normalizeMatrix = (matrix: any[][]) => {
    return matrix.map((row) => {
      // Sort inner arrays (assuming numbers or strings)
      return [...row].sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      });
    }).sort((a, b) => {
      // Sort outer array by comparing stringified inner arrays
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    });
  };

  const normExpected = normalizeMatrix(expected);
  const normActual = normalizeMatrix(actual);

  return JSON.stringify(normExpected) === JSON.stringify(normActual);
}
