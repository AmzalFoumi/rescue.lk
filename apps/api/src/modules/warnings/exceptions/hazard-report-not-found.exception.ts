import { NotFoundException } from '@nestjs/common';

// Sequence diagram: HazardReport lookup returned nothing for the selected report.
export class HazardReportNotFoundException extends NotFoundException {
  constructor(hazardReportId: string) {
    super(`Hazard report ${hazardReportId} was not found`);
  }
}
