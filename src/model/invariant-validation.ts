import { BaseException, BaseExceptionBhv } from '@logic/exception.base';
import { Arr, Either, NEA, Option, Record, pipe } from '@logic/fp';
import { Errors as IOErrors, Validation as IOValidation } from 'io-ts';

type NormalValidationErr = BaseException | NEA.NonEmptyArray<BaseException>;
export type StructValidationErr = Record<string, NormalValidationErr>;

export type ValidationErr = NormalValidationErr | StructValidationErr;

export type ValidationErrByKey = [Option.Option<string>, ValidationErr];

export const getErrorFromErrByKey = (vEBK: ValidationErrByKey) => vEBK[1];

export type ParsingInput<T> = {
  [K in keyof T]: Validation<T[K]>;
};

export type Validation<A> = Either.Either<ValidationErr, A>;

const ValiationErrTrait = {
  fromIOErrors: (ioErrors: IOErrors) =>
    pipe(
      ioErrors,
      Arr.map((error) =>
        BaseExceptionBhv.construct(
          error.message || 'unknown error',
          `IO_ERROR_${error.value}`,
        ),
      ),
    ),
};

export const checkCondition =
  <A>(params: { predicate: (a: A) => boolean; exception: ValidationErr }) =>
  (va: Validation<A>) =>
    pipe(
      va,
      Either.flatMap(
        Either.fromPredicate(params.predicate, () => params.exception),
      ),
    );
export const ValidationTrait = {
  left: <A>(error: ValidationErr) => Either.left(error) as Validation<A>,
  right: <A>(a: A) => Either.right(a) as Validation<A>,
  fromIOValidation: <A>(ioValidation: IOValidation<A>) =>
    pipe(
      ioValidation,
      Either.match(
        (e) =>
          ValidationTrait.left<A>(
            ValiationErrTrait.fromIOErrors(e) as ValidationErr,
          ),
        (v) => ValidationTrait.right(v),
      ),
    ),
  fromEither: <A>(either: Either.Either<ValidationErr, A>) =>
    either as Validation<A>,

  fromEitherWithCasting: <A>(either: Either.Either<ValidationErr, any>) =>
    either as Validation<A>,

  fromPredicate:
    <T, I = T>(predicate: (v: I) => boolean, onFalse: () => BaseException) =>
    (value: I) =>
      predicate(value)
        ? (ValidationTrait.right(value) as Validation<T>)
        : ValidationTrait.left<T>(onFalse()),
  checkCondition,
};

export type ValueOfValidation<B> = B extends Validation<infer A> ? A : unknown;
export type ValidationWithKey<A> = Either.Either<ValidationErrByKey, A>;

export const toValidationErr = (key: Option.Option<string>) =>
  Either.mapLeft((e: ValidationErr) => [key, e] as ValidationErrByKey);

export const mapErrorWithKey =
  (key: string) =>
  <E, T>(e: Either.Either<E, T>) =>
    pipe(
      e,
      Either.mapLeft((e) => ({ [key]: e }) as StructValidationErr),
    );

export type Parser<A, I = any> = (value: I) => Validation<A>;

export const ParserTrait = {
  fromPredicate: <T, I = unknown>(config: {
    exceptionMsg: string;
    exceptionCode: string;
    predicate: (v: I) => boolean;
  }) =>
    ValidationTrait.fromPredicate<T, I>(config.predicate, () =>
      BaseExceptionBhv.construct(config.exceptionMsg, config.exceptionCode),
    ),
};

export type StructValidation<A> = Either.Either<
  Record<string, NEA.NonEmptyArray<BaseException>>,
  A
>;

type Prim = string | number | boolean | Date;

type PrimLiken<T extends Prim> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends Date
        ? Date
        : unknown;

export type Liken<T> = T extends {
  likenType: infer U;
}
  ? U
  : T extends Prim
    ? PrimLiken<T>
    : T extends Record<string | number | symbol, unknown> | Array<unknown>
      ? {
          [K in keyof T]: Liken<T[K]>;
        }
      : unknown;

export type CustomLiken<T, L> = T & {
  likenType: L;
};
