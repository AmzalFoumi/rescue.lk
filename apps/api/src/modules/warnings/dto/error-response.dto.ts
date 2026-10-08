import { ApiProperty } from '@nestjs/swagger';

// Body written by the global AllExceptionsFilter. For a 400 from the warning
// rules, message is { message, errors } with one error per form field.
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
