# Analytics & Report Generation (UC4)

**Assignee:** Nikeshala
**Roles Covered:** DMC Admin, Donor Organization

## Overview

This document outlines the architecture, data structures, and workflows for the Analytics and Report Generation module (UC4), as derived from the design prototype.

The primary goal of this module is to allow DMC (Disaster Management Centre) Officials to analyze disaster response data and generate statistical reports. These reports are then selectively made visible to Donor Organizations.

## Report Types & Data Structures

Based on the design, there are four core reports the system must generate in both **PDF** and **CSV** formats:

### 1. Alert Timeline (`ALERT_TIMELINE`)

- **Description:** A timeline of warnings issued across districts.
- **Columns:** `['Date', 'Warning', 'Hazard', 'Severity', 'District', 'Citizens reached']`
- **Key Metrics (Summary Figures):** Warnings issued, District alerts, Citizens reached.

### 2. Citizens Reached (`CITIZENS_REACHED`)

- **Description:** Aggregation of citizens notified per district.
- **Columns:** `['District', 'Warnings', 'Citizens reached', 'Share of total']`
- **Key Metrics:** Districts notified, Citizens reached, Most reached (District).

### 3. Shelter Occupancy (`SHELTER_OCCUPANCY`)

- **Description:** Status of shelters and bed availability.
- **Columns:** `['District', 'Shelters', 'Capacity', 'Occupied', 'Available', 'Status']`
- **Key Metrics:** Shelters (count), Days covered, Peak daily occupancy.

### 4. Resource Distribution (`RESOURCE_DISTRIBUTION`)

- **Description:** Tracking of relief items distributed by various organizations.
- **Columns:** `['District', 'Item', 'Owner organisation', 'Quantity']`
- **Key Metrics:** Districts supplied, Items delivered, Organisations (count).

## Role Workflows & Visibility Rules

The core business logic for report visibility operates as follows:

1.  **DMC Admin Workflow:**
    - The DMC Admin has full access to the "Report Generator" tab.
    - They can apply global filters: **Date Period** (From/To), **Hazard Type**, and **District**.
    - They can generate any of the 4 reports above based on the filtered data.
    - **Crucial Rule:** The DMC Admin has the authority to decide _which_ specific reports are published and made visible to Donor Organizations.

2.  **Donor Organization Workflow:**
    - The Donor Organization role (`DONOR`) has restricted access.
    - They cannot freely generate arbitrary reports on raw data.
    - They can only view and download (PDF/CSV) the specific reports that a DMC Admin has explicitly shared/published for them.

## Technical Implementation Plan (SOLID Approach)

Since the exact entities/schemas from other modules are still in progress, you should build the reporting infrastructure using the **Strategy Pattern** to decouple the formatting from the data logic.

### 1. The Strategy Interface

Define a standard payload that all reports will use.

```typescript
// apps/api/src/modules/analytics/interfaces/report-data.interface.ts
export interface ReportData {
  type: string; // e.g., 'ALERT_TIMELINE'
  title: string;
  filtersApplied: { period: string; district: string; hazard: string };
  columns: string[];
  rows: (string | number)[][];
}
```

```typescript
// apps/api/src/modules/analytics/interfaces/report-formatter.interface.ts
export interface IReportFormatter {
  generate(data: ReportData): Promise<Buffer>;
}
```

### 2. Formatters

Create `PdfFormatterService` and `CsvFormatterService` implementing `IReportFormatter`.

- **PDF:** Use `pdfmake` to take `data.columns` and `data.rows` and build a table layout.
- **CSV:** Use `csv-stringify` to combine columns and rows into a string, returning a `Buffer`.

### 3. Data Gathering (Service Layer)

The `AnalyticsService` will expose methods to fetch this data. For now, mock the arrays:

```typescript
async generateReport(type: string, filters: ReportFilters, format: 'pdf' | 'csv'): Promise<Buffer> {
   // 1. Fetch data based on `type` (Mock this for now)
   const data: ReportData = await this.getMockData(type, filters);

   // 2. Select formatter
   const formatter = this.reportFactory.getFormatter(format);

   // 3. Return buffer
   return formatter.generate(data);
}
```

### 4. Visibility Control (Database Schema)

To handle the "DMC Admin decides what is visible" rule, UC4 needs its own database collection (e.g., `PublishedReport`).

When a DMC Admin generates a report, they can click "Publish to Donors". This saves the report's snapshot (or its parameters) into the `PublishedReport` collection. The endpoint for Donors will only query this collection.
