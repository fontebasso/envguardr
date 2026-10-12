import type { CustomValidatorFn } from "valitype";

// Validators that valitype 3 does not provide (or provides too loosely).

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// valitype 3 has no length validator. Count code points, not UTF-16 units.
export function lengthAtLeast(min: number, message: string): CustomValidatorFn {
  return (value) => value === undefined || [...value].length >= min || message;
}

export function lengthAtMost(max: number, message: string): CustomValidatorFn {
  return (value) => value === undefined || [...value].length <= max || message;
}

// valitype 3's date validator accepts impossible dates such as 2023-02-30.
export function calendarDate(message: string): CustomValidatorFn {
  return (value) => {
    if (value === undefined) return true;
    const match = DATE.exec(value);
    if (!match) return message;

    const [year, month, day] = match.slice(1).map(Number);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    const valid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
    return valid || message;
  };
}
