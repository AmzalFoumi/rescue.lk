import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './dto/error-response.dto.js';

// One description per error status the warnings endpoints can return, so each
// route lists its errors in one line instead of repeating @ApiResponse blocks.
const ERROR_DESCRIPTIONS = {
  [HttpStatus.BAD_REQUEST]:
    'Invalid input. Warning rule failures are in message.errors, one per field.',
  [HttpStatus.NOT_FOUND]: 'Warning, hazard report or delivery record not found',
  [HttpStatus.CONFLICT]: 'The warning or delivery is in the wrong status',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'The source hazard report is not verified',
} as const;

export type ApiErrorStatus = keyof typeof ERROR_DESCRIPTIONS;

// ApiErrorResponses documents the error statuses of a route in Swagger.
// DRY: one decorator call such as ApiErrorResponses(404, 409) replaces an
// @ApiResponse block per status on every route, and every route describes the same
// status the same way, using the shared ErrorResponseDto shape.
export const ApiErrorResponses = (...statuses: ApiErrorStatus[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: ERROR_DESCRIPTIONS[status],
        type: ErrorResponseDto,
      }),
    ),
  );
