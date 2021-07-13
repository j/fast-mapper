import { ClassMapper, Mapper } from './mappers';
import { Constructor } from './typings';
import { Type } from './types';

export * from './decorators';
export * from './metadata';
export * from './errors';
export * from './types';
export * from './typings';
export * from './utils';
export * from './mappers';

/**
 * Mappers contain their own definition storage & decorator factories
 * so that 3rd party consumers can utilize class mapping without interrupting
 * with users' implementations.
 */
export const mapper = new Mapper();

export const Property = mapper.decorators.Property;
export const Parent = mapper.decorators.Parent;
export const Discriminator = mapper.decorators.Discriminator;

export function map<Class>(Ctor: Constructor<Class>): ClassMapper<Class> {
  return mapper.map(Ctor);
}

export function registerType<T extends Type>(
  type: T,
  override: boolean = false
): void {
  return mapper.registerType(type, override);
}
