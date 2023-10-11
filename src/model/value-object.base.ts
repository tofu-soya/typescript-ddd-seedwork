/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

import { Either, Eq, ReadonlyRecord, S } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';
import { equals } from 'ramda';
import { IValidate } from './invariant-validation';

export type ValueObject<T> = {
  readonly props: T;
  readonly _tag: string;
};

const voEqual = Eq.struct({
  _tag: S.Eq,
  props: {
    equals: (p1, p2) => equals(p1, p2),
  },
});

const isEqual = <T>(v1: ValueObject<T>, v2: ValueObject<T>) =>
  voEqual.equals(v1, v2);

const construct = <T>(validate: IValidate<T>, tag: string, props: T) => {
  return pipe(
    validate(props),
    Either.as(
      ReadonlyRecord.fromRecord({
        _tag: tag,
        props,
      }),
    ),
  );
};

const getTag = <T>(vo: ValueObject<T>) => vo._tag;

const unpack = <T>(vo: ValueObject<T>) => vo.props;

export const ValueObjectTrait = {
  construct,
  isEqual,
  getTag,
  unpack,
};