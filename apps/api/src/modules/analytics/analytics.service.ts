import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'analytics' };
  }
}
