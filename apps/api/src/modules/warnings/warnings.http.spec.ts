import {
  HttpStatus,
  Logger,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
  type Mocked,
} from 'vitest';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter.js';
import { WarningsController } from './warnings.controller.js';
import { WarningsService } from './warnings.service.js';
import { WarningQueryService } from './warning-query.service.js';
import { toWarningDto } from './warnings.mapper.js';
import { InvalidWarningException } from './exceptions/invalid-warning.exception.js';
import { ReportNotVerifiedException } from './exceptions/report-not-verified.exception.js';
import { HazardReportNotFoundException } from './exceptions/hazard-report-not-found.exception.js';
import { WarningNotFoundException } from './exceptions/warning-not-found.exception.js';
import { WarningStatusConflictException } from './exceptions/warning-status-conflict.exception.js';
import { DeliveryNotRetryableException } from './exceptions/delivery-not-retryable.exception.js';
import {
  OFFICER,
  VERIFIED_REPORT,
  WARNING_ID,
  buildWarningRecord,
} from './testing/warning.fixtures.js';

const BASE = '/api/warnings';
const RECORD_ID = '665f1b2c9d3e4a0012345671';

const draftBody = {
  sourceReportId: VERIFIED_REPORT.id,
  hazard: 'FLOOD',
  severity: 'HIGH',
  areaIds: ['B-KALU'],
  message: 'The Kalu Ganga is rising quickly near Ratnapura.',
  createdBy: OFFICER,
};
const publishBody = {
  ...draftBody,
  instructions: 'Move to higher ground.',
  channels: ['SMS', 'PUSH'],
};
const { sourceReportId: _source, createdBy: _by, ...updateBody } = publishBody;

// One mock stands in for both services: commands and read-only queries.
type ServiceMock = Mocked<
  Pick<
    WarningsService,
    'saveDraft' | 'publish' | 'update' | 'cancel' | 'retryDelivery'
  > &
    Pick<
      WarningQueryService,
      | 'listVerifiedReports'
      | 'listTargetAreas'
      | 'estimateReach'
      | 'list'
      | 'latestDeliveries'
    >
>;

// HTTP contract of the warnings API: routing, request validation and the
// exception -> status mapping done by the global AllExceptionsFilter.
describe('Warnings HTTP API', () => {
  let app: INestApplication;
  const service: ServiceMock = {
    listVerifiedReports: vi.fn(),
    listTargetAreas: vi.fn(),
    estimateReach: vi.fn(),
    list: vi.fn(),
    saveDraft: vi.fn(),
    publish: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    latestDeliveries: vi.fn(),
    retryDelivery: vi.fn(),
  };
  const warningDto = toWarningDto(buildWarningRecord());

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [WarningsController],
      providers: [
        { provide: WarningsService, useValue: service },
        { provide: WarningQueryService, useValue: service },
      ],
    }).compile();

    app = module.createNestApplication({ logger: false });
    // Same global setup as main.ts.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  const http = () => request(app.getHttpServer());

  describe('routes and success codes', () => {
    it('GET /verified-reports -> 200', async () => {
      service.listVerifiedReports.mockResolvedValue([VERIFIED_REPORT]);

      const response = await http().get(`${BASE}/verified-reports`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual([VERIFIED_REPORT]);
    });

    it('GET /target-areas -> 200', async () => {
      service.listTargetAreas.mockReturnValue([]);

      await http().get(`${BASE}/target-areas`).expect(HttpStatus.OK);
    });

    it('GET /reach accepts one area id as a list', async () => {
      service.estimateReach.mockReturnValue({ districts: [], channels: [] });

      await http().get(`${BASE}/reach?areaIds=B-KALU`).expect(HttpStatus.OK);

      expect(service.estimateReach).toHaveBeenCalledWith(['B-KALU']);
    });

    it('GET /reach accepts several area ids, and none', async () => {
      service.estimateReach.mockReturnValue({ districts: [], channels: [] });

      await http()
        .get(`${BASE}/reach?areaIds=B-KALU&areaIds=D-COLOMBO`)
        .expect(HttpStatus.OK);
      await http().get(`${BASE}/reach`).expect(HttpStatus.OK);

      expect(service.estimateReach).toHaveBeenNthCalledWith(1, [
        'B-KALU',
        'D-COLOMBO',
      ]);
      expect(service.estimateReach).toHaveBeenNthCalledWith(2, []);
    });

    it('GET /?status=ACTIVE -> 200 with the filter passed through', async () => {
      service.list.mockResolvedValue([warningDto]);

      await http().get(`${BASE}?status=ACTIVE`).expect(HttpStatus.OK);

      expect(service.list).toHaveBeenCalledWith('ACTIVE');
    });

    it('POST /drafts accepts a draft without instructions or channels -> 201', async () => {
      service.saveDraft.mockResolvedValue(warningDto);

      await http()
        .post(`${BASE}/drafts`)
        .send(draftBody)
        .expect(HttpStatus.CREATED);

      expect(service.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: OFFICER,
          form: expect.objectContaining({ instructions: '', channels: [] }),
        }),
      );
    });

    it('POST /publish -> 201', async () => {
      service.publish.mockResolvedValue({
        warning: warningDto,
        deliveries: [],
      });

      await http()
        .post(`${BASE}/publish`)
        .send(publishBody)
        .expect(HttpStatus.CREATED);
    });

    it('PATCH /:id -> 200', async () => {
      service.update.mockResolvedValue({ warning: warningDto, deliveries: [] });

      await http()
        .patch(`${BASE}/${WARNING_ID}`)
        .send(updateBody)
        .expect(HttpStatus.OK);
    });

    it('POST /:id/cancel -> 200', async () => {
      service.cancel.mockResolvedValue(warningDto);

      await http()
        .post(`${BASE}/${WARNING_ID}/cancel`)
        .send({ reason: 'Water receding' })
        .expect(HttpStatus.OK);
    });

    it('GET /:id/deliveries -> 200', async () => {
      service.latestDeliveries.mockResolvedValue([]);

      await http()
        .get(`${BASE}/${WARNING_ID}/deliveries`)
        .expect(HttpStatus.OK);
    });

    it('POST /deliveries/:recordId/retry -> 200', async () => {
      service.retryDelivery.mockResolvedValue({
        id: RECORD_ID,
      } as Awaited<ReturnType<WarningsService['retryDelivery']>>);

      await http()
        .post(`${BASE}/deliveries/${RECORD_ID}/retry`)
        .expect(HttpStatus.OK);
    });
  });

  describe('request validation (ValidationPipe) -> 400', () => {
    it('rejects an unknown status filter', async () => {
      await http().get(`${BASE}?status=EXPIRED`).expect(HttpStatus.BAD_REQUEST);
      expect(service.list).not.toHaveBeenCalled();
    });

    it('rejects a malformed warning id', async () => {
      await http()
        .get(`${BASE}/not-an-id/deliveries`)
        .expect(HttpStatus.BAD_REQUEST);
      expect(service.latestDeliveries).not.toHaveBeenCalled();
    });

    it('rejects an unknown channel', async () => {
      await http()
        .post(`${BASE}/publish`)
        .send({ ...publishBody, channels: ['FAX'] })
        .expect(HttpStatus.BAD_REQUEST);
      expect(service.publish).not.toHaveBeenCalled();
    });

    it('rejects fields the API does not know', async () => {
      await http()
        .post(`${BASE}/publish`)
        .send({ ...publishBody, expiresAt: '2026-10-09T00:00:00Z' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects a source report change on update', async () => {
      await http()
        .patch(`${BASE}/${WARNING_ID}`)
        .send({ ...updateBody, sourceReportId: VERIFIED_REPORT.id })
        .expect(HttpStatus.BAD_REQUEST);
      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('domain exceptions (AllExceptionsFilter)', () => {
    it('InvalidWarningException -> 400 with one error per field in message.errors', async () => {
      const errors = {
        message: 'Write a message of at least 20 characters.',
        channels: 'Select at least one channel.',
      };
      service.publish.mockRejectedValue(new InvalidWarningException(errors));

      const response = await http().post(`${BASE}/publish`).send(publishBody);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toMatchObject({
        statusCode: HttpStatus.BAD_REQUEST,
        path: `${BASE}/publish`,
        message: { errors },
      });
    });

    it('ReportNotVerifiedException -> 422', async () => {
      service.publish.mockRejectedValue(
        new ReportNotVerifiedException(VERIFIED_REPORT.id, 'pending'),
      );

      await http()
        .post(`${BASE}/publish`)
        .send(publishBody)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('HazardReportNotFoundException -> 404', async () => {
      service.saveDraft.mockRejectedValue(
        new HazardReportNotFoundException(VERIFIED_REPORT.id),
      );

      await http()
        .post(`${BASE}/drafts`)
        .send(draftBody)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('WarningNotFoundException -> 404', async () => {
      service.update.mockRejectedValue(
        new WarningNotFoundException(WARNING_ID),
      );

      await http()
        .patch(`${BASE}/${WARNING_ID}`)
        .send(updateBody)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('WarningStatusConflictException -> 409 with the reason', async () => {
      service.cancel.mockRejectedValue(
        new WarningStatusConflictException({
          warningId: WARNING_ID,
          action: 'cancel',
          currentStatus: 'CANCELLED',
          requiredStatus: 'ACTIVE',
        }),
      );

      const response = await http()
        .post(`${BASE}/${WARNING_ID}/cancel`)
        .send({ reason: 'Water receding' });

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toMatchObject({
        message: expect.stringContaining('CANCELLED'),
      });
    });

    it('DeliveryNotRetryableException -> 409', async () => {
      service.retryDelivery.mockRejectedValue(
        new DeliveryNotRetryableException({
          recordId: RECORD_ID,
          reason: 'it is SENT',
        }),
      );

      await http()
        .post(`${BASE}/deliveries/${RECORD_ID}/retry`)
        .expect(HttpStatus.CONFLICT);
    });
  });
});
