import { api } from "./client";
import type { Pagination } from "./businesses";

export type OperationalLogSeverity = "INFO" | "WARN" | "ERROR";

export type OperationalLog = {
  id: string;
  businessId: string;
  mode: "TEST" | "LIVE" | null;
  severity: OperationalLogSeverity;
  event: string;
  entityType: string | null;
  entityId: string | null;
  requestId: string | null;
  message: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export type ListOperationalLogsParams = {
  limit?: number;
  cursor?: string;
  severity?: OperationalLogSeverity;
  event?: string;
  mode?: "TEST" | "LIVE";
  entityType?: string;
  entityId?: string;
  requestId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type OperationalLogSummary = {
  total: number;
  bySeverity: Partial<Record<OperationalLogSeverity, number>>;
  topEvents: Array<{ event: string; count: number }>;
};

export async function listOperationalLogs(businessId: string, params: ListOperationalLogsParams = {}) {
  const response = await api.get<{
    data: { logs: OperationalLog[]; pagination: Pagination };
  }>(`/businesses/${businessId}/logs`, {
    params: { limit: 20, ...params }
  });
  return response.data.data;
}

export async function getOperationalLog(businessId: string, logId: string) {
  const response = await api.get<{ data: { log: OperationalLog } }>(`/businesses/${businessId}/logs/${logId}`);
  return response.data.data.log;
}

export async function getOperationalLogSummary(businessId: string, params: Omit<ListOperationalLogsParams, "cursor" | "limit"> = {}) {
  const response = await api.get<{ data: OperationalLogSummary }>(`/businesses/${businessId}/logs/summary`, {
    params
  });
  return response.data.data;
}
