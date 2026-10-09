import { ApiProperty } from '@nestjs/swagger';

// ErrorResponseDto documents the body of every error answer in Swagger.
// SRP: only the global AllExceptionsFilter turns exceptions into HTTP answers, so
// controllers have no try/catch and every error has this same shape.
// A 400 from the warning rules carries { message, errors } with one error per form
// field, which the web app shows next to each input.
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;

  @ApiProperty({ example: '/api/warnings/publish' })
  path!: string;

  @ApiProperty({
    description:
      'Error detail: a string, a list of input errors, or { message, errors } with per-field warning errors',
    example: {
      message: 'Warning failed validation',
      errors: { message: 'Write a message of at least 20 characters.' },
    },
  })
  message!: unknown;
}
