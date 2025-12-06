// Path: src/utils/biometricFileParser.ts

/**
 * Biometric file format (example):
 *
 * 24102134037    2025-07-31 18:39:10    1   1   15  0
 * regNo          datetime               ...ignored...
 *
 * RULE:
 * - We ONLY care about:
 *   - regNo  (first column)
 *   - date   (YYYY-MM-DD from second column or inside datetime)
 * - Anything else is ignored.
 */

// env based config (easy future changes)
const MAX_LINES = parseInt(process.env.BIOMETRIC_MAX_LINES || "50000", 10);
const REGNO_LENGTH = parseInt(process.env.BIOMETRIC_REGNO_LENGTH || "11", 10);
const ALLOW_FUTURE_DATES =
  (process.env.BIOMETRIC_ALLOW_FUTURE_DATES || "false").toLowerCase() ===
  "true";

const REGNO_REGEX = new RegExp(`^[0-9]{${REGNO_LENGTH}}$`);

// small helper: compare ISO date strings "YYYY-MM-DD"
const isAfter = (a: string, b: string) => a > b;
const todayIso = () => new Date().toISOString().slice(0, 10);

export interface ParsedBiometricRecord {
  regNo: string;
  date: string;
  rawLine: string;
  lineNumber: number;
}

export interface BiometricParseResult {
  records: ParsedBiometricRecord[];
  summary: {
    totalLines: number;
    parsedLines: number;
    invalidLines: number;
    uniquePairs: number;
    maxLinesApplied: boolean;
    fromDate: string | null;
    toDate: string | null;
  };
}

export const parseBiometricFile = (buffer: Buffer): BiometricParseResult => {
  // normalise CRLF / LF
  const text = buffer.toString("utf8").replace(/\r/g, "");
  const lines = text.split("\n");

  const records: ParsedBiometricRecord[] = [];
  const uniquePairs = new Set<string>(); // "regNo|date"

  let totalLines = 0;
  let parsedLines = 0;
  let invalidLines = 0;

  let minDate: string | null = null;
  let maxDate: string | null = null;

  const today = todayIso();

  for (let i = 0; i < lines.length; i++) {
    if (MAX_LINES && totalLines >= MAX_LINES) break;
    let raw = lines[i];
    if (!raw) continue;

    raw = raw.trim();
    if (!raw) continue; // empty after trim

    totalLines++;

    // OPTIONAL: skip header-like lines (start with non-digit)
    if (!/^[0-9]/.test(raw)) {
      // treat as header or junk, don't count as invalid
      continue;
    }

    // Split by whitespace or tab
    const parts = raw.split(/\s+/);
    if (parts.length < 2) {
      invalidLines++;
      continue;
    }

    const regNo = parts[0];
    const dateTime = parts[1]; // "2025-07-31" or "2025-07-31T18:39:10" or "2025-07-31 18:39:10"

    // regNo must be numeric-ish and length REGNO_LENGTH
    if (!REGNO_REGEX.test(regNo)) {
      invalidLines++;
      continue;
    }

    // Extract date part safely
    const datePart = dateTime.split("T")[0].split(" ")[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      invalidLines++;
      continue;
    }

    // Optional: block future dates to avoid machine clock errors
    if (!ALLOW_FUTURE_DATES && isAfter(datePart, today)) {
      invalidLines++;
      continue;
    }

    const key = `${regNo}|${datePart}`;
    if (uniquePairs.has(key)) {
      // Same regNo+date in same file → ignore duplicate line
      continue;
    }

    uniquePairs.add(key);
    parsedLines++;

    // track min/max date
    if (!minDate || isAfter(minDate, datePart)) {
      minDate = datePart;
    }
    if (!maxDate || isAfter(datePart, maxDate)) {
      maxDate = datePart;
    }

    records.push({
      regNo,
      date: datePart,
      rawLine: raw,
      lineNumber: i + 1,
    });
  }

  return {
    records,
    summary: {
      totalLines,
      parsedLines,
      invalidLines,
      uniquePairs: uniquePairs.size,
      maxLinesApplied: !!MAX_LINES,
      fromDate: minDate,
      toDate: maxDate,
    },
  };
};

export default parseBiometricFile;
