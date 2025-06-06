import { ReadonlyRecord } from 'effect/Record';
import { Effect, Option, ParseResult as ParseResultEffect } from 'effect';
import { CoreException, ParseResult } from './validation';
import { DomainModel, DomainModelTrait } from './domain-model.base';
import { Identifier } from 'src/typeclasses/obj-with-id';
import { GetProps } from 'src/typeclasses';

/**
 * Entity type that extends DomainModel with additional properties
 */
export type Entity<
  Props extends ReadonlyRecord<string, unknown> = ReadonlyRecord<
    string,
    unknown
  >,
> = DomainModel<Props> & {
  readonly id: Identifier;
  readonly updatedAt: Option.Option<Date>;
};

/**
 * Common properties for all entities
 */
export type EntityCommonProps = Omit<Entity, 'props'>;

/**
 * Input type for entity creation with metadata
 */
export type WithEntityMetaInput<OriginInput> = OriginInput & {
  id?: string;
  createdAt: Option.Option<Date>;
  updatedAt: Option.Option<Date>;
};

/**
 * Parser for entity properties
 */
export type EntityPropsParser<E extends Entity = Entity, I = unknown> = (
  raw: I,
) => ParseResult<E['props']>;

/**
 * Interface for entity trait
 */
export interface EntityTrait<
  E extends Entity,
  NewParams = unknown,
  ParseParams = unknown,
> extends DomainModelTrait<E, NewParams, WithEntityMetaInput<ParseParams>> {}

/**
 * Type for entity invariant parser
 */
export type EntityInvariantParser<
  E extends Entity,
  IsProperty extends boolean,
  V,
> = IsProperty extends true
  ? (entity: E) => (value: unknown) => ParseResult<V>
  : (entity: E) => (value: unknown) => ParseResult<V>;

/**
 * Command on model type for entity operations
 */
export type CommandResult<DM extends Entity> = Effect.Effect<
  DM,
  CoreException,
  any
>;

export type CommandOnModel<DM extends Entity> = (
  dm: DM,
  correlationId?: string,
) => CommandResult<DM>;
/**
 * Generic entity trait interface
 */
export interface IEntityGenericTrait {
  getTag: (entity: Entity) => string;
  getId: <E extends Entity>(entity: E) => Identifier;
  getCreatedAt: <E extends Entity>(entity: E) => Date;
  getUpdatedAt: <E extends Entity>(entity: E) => Option.Option<Date>;
  markUpdated: <E extends Entity>(entity: E) => E;
  unpack: <E extends Entity>(entity: E) => GetProps<E>;
  isEqual: <E extends Entity>(entity1: E, entity2: E) => boolean;
  createEntityTrait: <E extends Entity, N = unknown, P = unknown>(
    propsParser: EntityPropsParser<E, P>,
    tag: string,
    options?: { autoGenId: boolean },
  ) => EntityTrait<E, N, P>;
  asCommand: <E extends Entity, I>(
    reducerLogic: (
      input: I,
      props: GetProps<E>,
      entity: E,
    ) => Effect.Effect<{ props: GetProps<E> }, CoreException, never>,
  ) => (input: I) => CommandOnModel<E>;
}
