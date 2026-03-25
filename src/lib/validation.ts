// Simple input validation helpers for API endpoints

export function validateString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters`);
  }
  return value.trim();
}

export function validateOptionalString(value: unknown, field: string, maxLength = 500): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return validateString(value, field, maxLength);
}

export function validateEnum<T extends string>(value: unknown, field: string, allowed: T[]): T {
  if (!allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function validateBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError(`${field} must be a boolean`);
  }
  return value;
}

export function validateId(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length < 10 || value.length > 50) {
    throw new ValidationError(`${field} must be a valid ID`);
  }
  return value;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function handleValidationError(err: unknown): { error: string; status: number } | null {
  if (err instanceof ValidationError) {
    return { error: err.message, status: 400 };
  }
  return null;
}
