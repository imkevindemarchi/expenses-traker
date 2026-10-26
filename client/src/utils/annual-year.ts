export function annualYear(value: string | null, currentYear: number): string {
  return value && /^\d{4}$/.test(value) && Number(value) >= 2000 && Number(value) <= currentYear
    ? value : String(currentYear);
}
