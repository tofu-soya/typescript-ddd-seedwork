import { Effect, Option, pipe } from 'effect';
import {
  CommandOnModel,
  Entity,
  EntityPropsParser,
  EntityTrait,
  IEntityGenericTrait,
  WithEntityMetaInput,
} from './entity.base';
import { GetProps, Identifier } from 'src/typeclasses';
import { ParseResult } from './validation';
import { v4 as uuidv4 } from 'uuid';
import { BaseException } from '@logic/exception.base';
import { IDomainEvent } from './domain-event.interface';
/**
 * Implementation of the generic entity trait
 */
export const EntityGenericTrait: IEntityGenericTrait = {
  getTag: (entity) => entity._tag,

  getId: (entity) => entity.id,

  getCreatedAt: (entity) => entity.createdAt,

  getUpdatedAt: (entity) => entity.updatedAt,

  markUpdated: <E extends Entity>(entity: E): E => ({
    ...entity,
    updatedAt: Option.some(new Date()),
  }),

  unpack: <E extends Entity>(entity: E): GetProps<E> =>
    entity.props as GetProps<E>,

  isEqual: <E extends Entity>(entity1: E, entity2: E): boolean =>
    entity1._tag === entity2._tag && entity1.id === entity2.id,

  createEntityTrait: <E extends Entity, N = unknown, P = unknown>(
    propsParser: EntityPropsParser<E, P>,
    tag: string,
    options = { autoGenId: true },
  ): EntityTrait<E, N, P> => {
    const parse = (input: WithEntityMetaInput<P>): ParseResult<E> => {
      return pipe(
        Effect.succeed(input),
        Effect.flatMap((data) => {
          const id = options.autoGenId && !data.id ? uuidv4() : data.id || '';
          const createdAt = data.createdAt || new Date();
          const updatedAt = data.updatedAt || Option.none();

          return pipe(
            propsParser(data),
            Effect.map(
              (props) =>
                ({
                  _tag: tag,
                  id: id as Identifier,
                  createdAt,
                  updatedAt,
                  props,
                }) as E,
            ),
          );
        }),
      );
    };

    return {
      parse,
      new: (params: N) => parse(params as unknown as WithEntityMetaInput<P>),
    };
  },
  asCommand: <E extends Entity, I>(
    reducerLogic: (
      input: I,
      props: GetProps<E>,
      entity: E,
    ) => Effect.Effect<{ props: GetProps<E> }, BaseException, never>,
  ) => {
    return (input: I): CommandOnModel<E> => {
      return (entity: E) => {
        return pipe(
          reducerLogic(input, EntityGenericTrait.unpack(entity), entity),
          Effect.map(
            ({ props }): E => ({
              ...entity,
              props: props as E['props'],
              updatedAt: Option.some(new Date()),
              // Domain events would be handled separately in a real implementation
            }),
          ),
        );
      };
    };
  },
};

/**
 * Helper function to create an entity trait
 */
export const createEntityTrait = <E extends Entity, N = unknown, P = unknown>(
  propsParser: EntityPropsParser<E>,
  tag: string,
  options?: { autoGenId: boolean },
): EntityTrait<E, N, P> => {
  return EntityGenericTrait.createEntityTrait(propsParser, tag, options);
};

/**
 * AsReducer function type
 */

/**
 * Implementation of asReducer function
 *
 * This function allows creating reducers that modify entity properties
 * and generate domain events in a type-safe way.
 */
