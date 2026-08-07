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

/**
 * Utility to replace any legacy ASP.NET localhost ports (e.g. http://localhost:5203)
 * with the dynamically computed current server origin, ensuring all assets load.
 */
export function fixUrlsInObject(obj: any, origin: string): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => fixUrlsInObject(item, origin));
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    const mappedObj: any = {};
    for (const key of Object.keys(obj)) {
      mappedObj[key] = fixUrlsInObject(obj[key], origin);
    }
    return mappedObj;
  }

  if (typeof obj === "string") {
    return obj.replace(/https?:\/\/localhost:\d+/g, origin);
  }

  return obj;
}
