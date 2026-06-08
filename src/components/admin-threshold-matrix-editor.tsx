"use client";

type EditableMatrixRow = {
  unter?: string;
  exakt: string;
  uber: string;
};

export type EditableThresholdMatrix = {
  matrixStart: number;
  matrixRowCount: number;
  rows: EditableMatrixRow[];
};

export function AdminThresholdMatrixEditor({
  title,
  description,
  matrix,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  matrix: EditableThresholdMatrix;
  disabled: boolean;
  onChange: (matrix: EditableThresholdMatrix) => void;
}) {
  function updateStart(nextStart: number) {
    const matrixStart = Math.min(30, Math.max(0, Math.round(nextStart)));
    onChange({
      ...matrix,
      matrixStart,
      rows: resizeRows(matrix.rows, matrix.matrixRowCount, matrixStart),
    });
  }

  function updateRowCount(nextCount: number) {
    const matrixRowCount = Math.min(15, Math.max(1, Math.round(nextCount)));
    onChange({
      matrixStart: matrix.matrixStart,
      matrixRowCount,
      rows: resizeRows(matrix.rows, matrixRowCount, matrix.matrixStart),
    });
  }

  function updateRow(index: number, field: keyof EditableMatrixRow, value: string) {
    onChange({
      ...matrix,
      rows: matrix.rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    });
  }

  return (
    <section className="min-w-0 max-w-full rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <h4 className="font-medium text-zinc-900">{title}</h4>
      <p className="mt-1 text-xs text-zinc-600">{description}</p>

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-800">Erste Schwelle (N)</span>
          <input
            type="number"
            min={0}
            max={30}
            disabled={disabled}
            value={matrix.matrixStart}
            onChange={(event) => updateStart(Number(event.target.value))}
            className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm tabular-nums disabled:bg-zinc-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-zinc-800">Anzahl Zeilen</span>
          <input
            type="number"
            min={1}
            max={15}
            disabled={disabled}
            value={matrix.matrixRowCount}
            onChange={(event) => updateRowCount(Number(event.target.value))}
            className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm tabular-nums disabled:bg-zinc-100"
          />
        </label>
      </div>

      <div className="mt-3 max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-zinc-200 bg-white">
        <table className="w-full min-w-[20rem] border-collapse text-sm sm:min-w-[28rem]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="px-3 py-2 font-semibold text-zinc-800">Schwelle N</th>
              <th className="px-3 py-2 font-semibold text-zinc-800">Unter</th>
              <th className="px-3 py-2 font-semibold text-zinc-800">Exakt</th>
              <th className="px-3 py-2 font-semibold text-zinc-800">Über</th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row, index) => {
              const n = matrix.matrixStart + index;
              return (
                <tr key={index} className="border-b border-zinc-100">
                  <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-zinc-900">{n}</td>
                  <td className="px-2 py-1.5">
                    {n === 0 ? (
                      <span className="flex h-9 items-center justify-center text-sm text-zinc-400">–</span>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        max={1000}
                        required
                        disabled={disabled}
                        value={row.unter ?? ""}
                        onChange={(event) => updateRow(index, "unter", event.target.value)}
                        className="w-full min-w-0 rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-100"
                      />
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      max={1000}
                      required
                      disabled={disabled}
                      value={row.exakt}
                      onChange={(event) => updateRow(index, "exakt", event.target.value)}
                      className="w-full min-w-0 rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-100"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      max={1000}
                      required
                      disabled={disabled}
                      value={row.uber}
                      onChange={(event) => updateRow(index, "uber", event.target.value)}
                      className="w-full min-w-0 rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-100"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function resizeRows(rows: EditableMatrixRow[], targetCount: number, matrixStart: number): EditableMatrixRow[] {
  const nextRows = rows.slice(0, targetCount);
  while (nextRows.length < targetCount) {
    const n = matrixStart + nextRows.length;
    nextRows.push(n === 0 ? { exakt: "2", uber: "2" } : { unter: "2", exakt: "2", uber: "2" });
  }
  return nextRows.map((row, index) => {
    const n = matrixStart + index;
    if (n === 0) {
      return { exakt: row.exakt, uber: row.uber };
    }
    return { unter: row.unter ?? "2", exakt: row.exakt, uber: row.uber };
  });
}

export function serializeEditableMatrix(matrix: EditableThresholdMatrix) {
  return {
    matrixStart: matrix.matrixStart,
    matrixRowCount: matrix.matrixRowCount,
    rows: matrix.rows.map((row, index) => {
      const n = matrix.matrixStart + index;
      if (n === 0) {
        return {
          exakt: Number(row.exakt),
          uber: Number(row.uber),
        };
      }
      return {
        unter: Number(row.unter),
        exakt: Number(row.exakt),
        uber: Number(row.uber),
      };
    }),
  };
}
