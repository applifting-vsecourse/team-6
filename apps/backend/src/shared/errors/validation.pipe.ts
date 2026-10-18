import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export type FieldError = { field: string; code: string };

export class ValidationFailedException extends BadRequestException {
  constructor(readonly errors: FieldError[]) {
    super('Validation failed');
  }
}

// One entry per failed constraint; `code` is the class-validator constraint name
// (isNotEmpty, maxLength, ...) so the frontend can translate it by key.
function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    return [
      ...Object.keys(error.constraints ?? {}).map((code) => ({ field, code })),
      ...flatten(error.children ?? [], field),
    ];
  });
}

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors): ValidationFailedException =>
      new ValidationFailedException(flatten(errors)),
  });
