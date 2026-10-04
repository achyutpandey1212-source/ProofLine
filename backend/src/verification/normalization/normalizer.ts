/**
 * Normalizes weight units to kilograms (kg).
 * Supported: kg, g, grams, tonnes, metric tons, lbs/pounds.
 * Returns null if unit is unsupported or invalid.
 */
export const normalizeToKg = (
  value: number | null | undefined,
  unit: string | null | undefined
): { weightKg: number; unit: "kg" } | null => {
  if (value === null || value === undefined || isNaN(value)) {
    return null;
  }

  if (!unit || typeof unit !== "string") {
    return null;
  }

  const cleanUnit = unit.trim().toLowerCase();

  switch (cleanUnit) {
    case "kg":
    case "kgs":
    case "kilogram":
    case "kilograms":
      return { weightKg: value, unit: "kg" };

    case "g":
    case "grams":
    case "gram":
      return { weightKg: value / 1000, unit: "kg" };

    case "t":
    case "tonne":
    case "tonnes":
    case "ton":
    case "tons":
    case "metric ton":
    case "metric tons":
      return { weightKg: value * 1000, unit: "kg" };

    case "lb":
    case "lbs":
    case "pound":
    case "pounds":
      return { weightKg: value * 0.45359237, unit: "kg" };

    default:
      return null;
  }
};

/**
 * Normalizes entity and company names for comparison while avoiding false positives.
 */
export const normalizeEntityName = (name: string | null | undefined): string => {
  if (!name || typeof name !== "string") {
    return "";
  }

  return name
    .toLowerCase()
    .replace(/\b(private limited|pvt ltd|pvt\. ltd\.|ltd|limited|llc|inc|corp|corporation)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

/**
 * Normalizes alphanumeric transaction IDs.
 */
export const normalizeTransactionId = (id: string | null | undefined): string => {
  if (!id || typeof id !== "string") {
    return "";
  }
  return id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
};
