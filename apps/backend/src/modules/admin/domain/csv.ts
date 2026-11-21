export type CsvValue = string | number | boolean | Date | null;

/**
 * Plain CSV, separated by semicolons (what Czech spreadsheet locales open as columns). The exports hold ids, numbers, flags and dates only, never free text, so nothing
 * needs quoting and nothing can start a spreadsheet formula.
 */
export const toCsv = (header: string[], rows: CsvValue[][]): string =>
  [header, ...rows]
    .map((row) =>
      row
        .map((value) =>
          value === null
            ? ''
            : value instanceof Date
              ? value.toISOString()
              : String(value),
        )
        .join(';'),
    )
    .join('\n');
