import {
  BadRequestException,
  ConflictException,
  HttpException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  createValidationPipe,
  ValidationFailedException,
} from './validation.pipe';

class TestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  text!: string;
}

function run(exception: unknown): { status: number; body: unknown } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: (): { status: jest.Mock } => ({ status }),
    }),
  } as never;
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  new AllExceptionsFilter().catch(exception, host);
  return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

describe('createValidationPipe', () => {
  const transform = (value: unknown): ReturnType<ValidationPipe['transform']> =>
    createValidationPipe().transform(value, {
      type: 'body',
      metatype: TestDto,
    });

  it('returns constraint names as codes per field', async () => {
    const error = await transform({ text: 'toolong' }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationFailedException);
    expect(error.errors).toEqual([{ field: 'text', code: 'maxLength' }]);
  });

  it('rejects unknown properties', async () => {
    const error = await transform({ text: 'ok', extra: 1 }).catch((e) => e);
    expect(error.errors).toEqual([
      { field: 'extra', code: 'whitelistValidation' },
    ]);
  });
});

describe('AllExceptionsFilter', () => {
  it('maps validation failures to validation_failed with field errors', () => {
    const errors = [{ field: 'text', code: 'isNotEmpty' }];
    expect(run(new ValidationFailedException(errors))).toEqual({
      status: 400,
      body: {
        statusCode: 400,
        code: 'validation_failed',
        message: 'Validation failed',
        errors,
      },
    });
  });

  it.each([
    [new UnauthorizedException(), 401, 'unauthorized'],
    [new NotFoundException(), 404, 'not_found'],
    [new BadRequestException('nope'), 400, 'bad_request'],
  ])('maps %p to a stable code', (exception, status, code) => {
    expect(run(exception)).toMatchObject({
      status,
      body: { statusCode: status, code },
    });
  });

  it('uses the code an exception carries over the one for its status', () => {
    const exception = new ConflictException({
      code: 'kvintet_not_open',
      message: 'full',
    });
    expect(run(exception)).toMatchObject({
      status: 409,
      body: { statusCode: 409, code: 'kvintet_not_open' },
    });
    expect(run(new ConflictException())).toMatchObject({
      body: { code: 'conflict' },
    });
  });

  it('falls back to the status code when the response body is null', () => {
    expect(run(new HttpException(null as never, 409))).toMatchObject({
      status: 409,
      body: { code: 'conflict' },
    });
  });

  it('hides unexpected errors behind internal_error', () => {
    const { status, body } = run(new Error('db password leaked'));
    expect(status).toBe(500);
    expect(body).toEqual({
      statusCode: 500,
      code: 'internal_error',
      message: 'Internal server error',
    });
  });
});
