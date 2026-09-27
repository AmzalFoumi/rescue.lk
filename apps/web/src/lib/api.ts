import type { WarningDto, HazardReportDto, IncidentDto, DistrictDto } from "@rescue-lk/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new Error(`API request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  districts: {
    list: () => request<DistrictDto[]>("/districts"),
  },
  warnings: {
    list: () => request<WarningDto[]>("/warnings"),
  },
  hazardReports: {
    list: () => request<HazardReportDto[]>("/hazard-reports"),
  },
  incidents: {
    list: () => request<IncidentDto[]>("/response/incidents"),
  },
};
