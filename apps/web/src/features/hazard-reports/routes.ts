/** The UC2 pages. Links use these so a route is written in one place only. */
export const ROUTES = {
  home: '/hazard-reports',
  newReport: '/hazard-reports/new',
  myReports: '/hazard-reports/mine',
  verify: '/hazard-reports/verify',
} as const;

/**
 * The Warnings page of use case 1. The Home screen links to it.
 * When the UC1 owner's warnings API and screens are merged, recheck this link and the
 * Warnings tile text. See "Waiting for UC1" in docs/uc2-hazard-reports-web.md.
 */
export const WARNINGS_HREF = '/warnings';
