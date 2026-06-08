export type ThresholdMatrixRow = {
  unter?: number;
  exakt: number;
  uber: number;
};

export type ThresholdMatrixPrefix = "CARDS" | "CORNERS";

export function buildThresholdMatrixOptions(
  prefix: ThresholdMatrixPrefix,
  matrixStart: number,
  rows: ThresholdMatrixRow[],
): Array<{ outcome: string; odds: number }> {
  const options: Array<{ outcome: string; odds: number }> = [];

  for (let i = 0; i < rows.length; i += 1) {
    const n = matrixStart + i;
    const row = rows[i];
    if (n === 0) {
      options.push(
        { outcome: `${prefix}:E:${n}`, odds: row.exakt },
        { outcome: `${prefix}:O:${n}`, odds: row.uber },
      );
    } else {
      options.push(
        { outcome: `${prefix}:U:${n}`, odds: row.unter! },
        { outcome: `${prefix}:E:${n}`, odds: row.exakt },
        { outcome: `${prefix}:O:${n}`, odds: row.uber },
      );
    }
  }

  return options;
}

export function parseThresholdMatrixRowsFromOptions(
  prefix: ThresholdMatrixPrefix,
  options: Array<{ outcome: string; odds: number }>,
  matrixStart: number,
  matrixRowCount: number,
): ThresholdMatrixRow[] {
  const oddsByOutcome = new Map(options.map((option) => [option.outcome, option.odds]));
  const rows: ThresholdMatrixRow[] = [];

  for (let i = 0; i < matrixRowCount; i += 1) {
    const n = matrixStart + i;
    if (n === 0) {
      rows.push({
        exakt: oddsByOutcome.get(`${prefix}:E:${n}`) ?? 2,
        uber: oddsByOutcome.get(`${prefix}:O:${n}`) ?? 2,
      });
    } else {
      rows.push({
        unter: oddsByOutcome.get(`${prefix}:U:${n}`) ?? 2,
        exakt: oddsByOutcome.get(`${prefix}:E:${n}`) ?? 2,
        uber: oddsByOutcome.get(`${prefix}:O:${n}`) ?? 2,
      });
    }
  }

  return rows;
}

export const DEFAULT_THRESHOLD_MATRIX_ROW: ThresholdMatrixRow = {
  unter: 2,
  exakt: 2,
  uber: 2,
};

export const DEFAULT_THRESHOLD_MATRIX_ROW_N0: ThresholdMatrixRow = {
  exakt: 2,
  uber: 2,
};
