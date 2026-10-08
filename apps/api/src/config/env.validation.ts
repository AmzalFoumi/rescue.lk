import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3001';

  @IsString()
  MONGODB_URI!: string;

  // UC1: how many times an alert channel send is attempted before it is recorded as failed.
  @IsInt()
  @Min(1)
  MAX_SEND_ATTEMPTS: number = 3;

  // UC1 DEMO ONLY: channels whose first send attempt fails (e.g. "SMS" or
  // "SMS,SIREN"), to show automatic retry. Empty (the default) turns it off.
  @IsString()
  @Matches(/^((SMS|PUSH|SIREN)(,(SMS|PUSH|SIREN))*)?$/, {
    message:
      'MOCK_FAIL_FIRST_ATTEMPT_CHANNELS must be empty or a comma separated list of SMS, PUSH, SIREN',
  })
  MOCK_FAIL_FIRST_ATTEMPT_CHANNELS: string = '';
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
