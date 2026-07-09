/**
 * Utility to convert database PascalCase models to camelCase frontend models.
 * Handles specific abbreviations like CGPA and SOP.
 */
export function mapKeysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(mapKeysToCamelCase);
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    const mappedObj: any = {};
    for (const key of Object.keys(obj)) {
      let newKey = key;
      if (key === "CGPA") {
        newKey = "cgpa";
      } else if (key === "SOP") {
        newKey = "sop";
      } else {
        newKey = key.charAt(0).toLowerCase() + key.slice(1);
      }
      mappedObj[newKey] = mapKeysToCamelCase(obj[key]);
    }
    return mappedObj;
  }

  return obj;
}
