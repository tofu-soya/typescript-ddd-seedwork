/**
 * @desc ValueObjects are objects that we determine their
 * equality through their structrual property.
 */

import { Either, Eq, RRecord, Record, S } from '@logic/fp';
import { pipe } from 'fp-ts/lib/function';
import { equals } from 'ramda';
import {
  Liken,
  Parser,
  ParsingInput,
  Validation,
  ValidationTrait,
} from './invariant-validation';
import {
  BaseDMTraitFactoryConfig,
  DomainModelTrait,
  GenericDomainModelTrait,
  StdPropsParser,
  getBaseDMTrait,
} from './domain-model.base';

import { DomainModel } from './domain-model.base.type';
import { structSummarizerParsing } from './parser';
import { BaseExceptionBhv } from '@logic/exception.base';

export interface ValueObject<
  T extends Record<string, any> = RRecord.ReadonlyRecord<string, any>,
> extends DomainModel<Readonly<T>> {}

export const getVoEqual = <VO extends ValueObject>() =>
  Eq.struct({
    _tag: S.Eq,
    props: {
      equals: (p1, p2) => equals(p1, p2),
    },
  }) as Eq.Eq<VO>;

const isEqual = <VO extends ValueObject>(v1: VO, v2: VO) =>
  getVoEqual<VO>().equals(v1, v2);

const factory =
  <T extends ValueObject>(parser: Parser<T['props']>) =>
  (tag: string) =>
  (props: unknown) => {
    return pipe(
      parser(props),
      Either.as({
        _tag: tag,
        props,
      } as T),
    );
  };

export type VOLiken<T extends ValueObject> = T extends {
  likenType: infer U;
}
  ? U
  : {
      [K in keyof T['props']]: T['props'][K] extends ValueObject
        ? VOLiken<T['props'][K]>
        : T['props'][K] extends Array<unknown> & {
              [key: number]: ValueObject;
            }
          ? VOLiken<T['props'][K][0]>[]
          : Liken<T['props'][K]>;
    };

const structParsing = <ET extends ValueObject>(
  raw: ParsingInput<ET['props']>,
) => structSummarizerParsing<ET['props']>(raw);

export interface ValueObjectTrait<
  VO extends ValueObject,
  NewParam = any,
  ParseParam = any,
> extends DomainModelTrait<VO, NewParam, ParseParam> {}

export interface PrimitiveVOTrait<VO> {
  parse: Parser<VO>;
  new: (params: any) => Validation<VO>;
}

export const VOGenericTrait = {
  construct: factory,
  isEqual: isEqual,
  structParsingProps: GenericDomainModelTrait.structParsingProps,
  getTag: GenericDomainModelTrait.getTag,
  unpack: GenericDomainModelTrait.unpack,
  simpleQuery: GenericDomainModelTrait.simpleQuery,
  simpleQueryOpt: GenericDomainModelTrait.simpleQueryOpt,
};

export const getVOGenricTraitForType = <VO extends ValueObject>() => ({
  construct: factory<VO>,
  isEqual: isEqual<VO>,
  structParsingProps: GenericDomainModelTrait.structParsingProps<VO>,
  getTag: GenericDomainModelTrait.getTag,
  unpack: GenericDomainModelTrait.unpack,
  simpleQuery: GenericDomainModelTrait.simpleQuery,
  simpleQueryOpt: GenericDomainModelTrait.simpleQueryOpt,
});

export type VOStdPropsParser<
  VO extends ValueObject,
  I = unknown,
> = StdPropsParser<VO, I>;

export const getPrimitiveVOTrait = <T>(config: {
  predicate: (v: unknown) => boolean;
  exceptionMsg?: string;
  exceptionCode?: string;
}): PrimitiveVOTrait<T> => {
  const parse = (v: unknown) =>
    ValidationTrait.fromPredicate(config.predicate, () =>
      BaseExceptionBhv.construct(
        config.exceptionMsg || 'invalid value',
        config.exceptionCode || 'INVALID_VALUE',
      ),
    )(v) as Validation<T>;

  return {
    parse,
    new: parse,
  };
};

export const getBaseVOTrait = <VO extends ValueObject, I = VOLiken<VO>, P = I>(
  config: BaseDMTraitFactoryConfig<VO, I, P>,
) => getBaseDMTrait<VO, I, P>(VOGenericTrait.construct)(config);

export const ValueObjectAuFn = {
  construct: factory,
  isEqual,
  structParsing,
  getBaseVOTrait,
};
