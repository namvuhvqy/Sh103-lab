export interface OperationalSummaryInput {
  occurrences: Array<{ status: string }>;
  measurements: Array<{ temperature_abnormal: boolean; humidity_abnormal: boolean }>;
  shiftStatuses: Array<{ status_code: string }>;
  maintenancePending: number;
  decontaminationPending: number;
  readyPeriods: number;
  returnedPeriods: number;
  openIncidents: number;
  unreadNotifications: number;
}

export function buildOperationalSummary(input: OperationalSummaryInput) {
  const completed = input.occurrences.filter((item) => item.status === "COMPLETED").length;
  const na = input.occurrences.filter((item) => item.status === "N_A").length;
  const pending = input.occurrences.filter((item) => item.status === "PENDING").length;
  return {
    total: input.occurrences.length,
    completed,
    na,
    pending,
    completionRate: input.occurrences.length ? Math.round(((completed + na) / input.occurrences.length) * 100) : 0,
    abnormal: input.measurements.filter((item) => item.temperature_abnormal || item.humidity_abnormal).length,
    broken: input.shiftStatuses.filter((item) => item.status_code === "H").length,
    maintenancePending: input.maintenancePending,
    decontaminationPending: input.decontaminationPending,
    readyPeriods: input.readyPeriods,
    returnedPeriods: input.returnedPeriods,
    openIncidents: input.openIncidents,
    unreadNotifications: input.unreadNotifications,
  };
}

export function measurementPresentation(templateCode: string, temperature: number | null, humidity: number | null) {
  return {
    temperature: temperature === null ? null : `${temperature}°C`,
    humidity: templateCode === "BM.01/QL.HTAT.01" && humidity !== null ? `${humidity}%` : null,
  };
}

export function shiftCompletion(completed: number, total: number) {
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0, complete: total === 25 && completed === 25 };
}

export function filterOfficialRecords<T extends { is_effective: boolean; register_periods: { status: string } | null }>(rows: T[]) {
  return rows.filter((row) => row.is_effective && row.register_periods?.status === "APPROVED");
}
