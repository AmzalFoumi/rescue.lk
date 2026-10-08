const SHORT_ID_LENGTH = 4;

/**
 * The short id people read out, like "R-8215". The real id is a long database
 * id, so the short one is made from its last characters (display only).
 */
export function shortReportId(id: string): string {
  return `R-${id.slice(-SHORT_ID_LENGTH).toUpperCase()}`;
}
