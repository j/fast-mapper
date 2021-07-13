import {
  ClassMetadata,
  ClassMetadataFactory,
  DefinitionStorage
} from '../metadata';
import { Constructor } from '../typings';
import { createDecorators, Decorators } from '../decorators';

import type { ClassMapper } from './ClassMapper';
import { DateType, Type } from '../types';
import { ValidationError } from '../errors';
import { StringType } from '../types/StringType';

export class Mapper {
  public readonly decorators: Decorators;
  private readonly metadataFactory: ClassMetadataFactory;
  private readonly definitionStorage: DefinitionStorage;
  private readonly registeredTypes = new Map<string, Type>();

  constructor() {
    this.definitionStorage = new DefinitionStorage();
    this.metadataFactory = new ClassMetadataFactory(
      this,
      this.definitionStorage,
      this.registeredTypes
    );
    this.decorators = createDecorators(this.definitionStorage);

    // register default types
    this.registerType(new DateType());
    this.registerType(new StringType());
  }

  getMetadataFor<T>(Ctor: Constructor<T>): ClassMetadata {
    return this.metadataFactory.getMetadataFor(Ctor);
  }

  map<T>(Ctor: Constructor<T>): ClassMapper {
    return this.getMetadataFor<T>(Ctor).getMapper();
  }

  registerType<T extends Type>(type: T, override: boolean = false) {
    if (!(type instanceof Type)) {
      throw new Error('type must be instanceof Type');
    }

    if (!override && this.registeredTypes.has(type.name)) {
      throw new Error(`Type with name "${type.name}" already registered`);
    }

    this.registeredTypes.set(type.name, type);
  }

  getType(name: string): Type {
    if (!this.registeredTypes.has(name)) {
      throw new ValidationError(`Unknown property type "${name}".`);
    }

    return this.registeredTypes.get(name);
  }
}
