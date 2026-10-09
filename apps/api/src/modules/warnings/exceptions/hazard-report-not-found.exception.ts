import { NotFoundException } from '@nestjs/common';

// HazardReportNotFoundException (404): the selected hazard report does not exist
// (sequence diagram HazardReport lookup returned nothing).
// It extends NotFoundException, so the global AllExceptionsFilter sets the status.
export class HazardReportNotFoundException extends NotFoundException {
  constructor(hazardReportId: string) {
    super(`Hazard report ${hazardReportId} was not found`);
  }
}
