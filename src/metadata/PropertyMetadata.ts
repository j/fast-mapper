import { Constructor } from '../typings';
import { ClassMetadata } from './ClassMetadata';
import { PropertyDefinition } from './definitions';
import { Type } from '../types';
import { InternalError } from '../errors';

export interface PropertyMetadataOptions<T = any>
  extends Omit<PropertyDefinition<T>, 'type'> {
  type: Type;
  nestedType?: Constructor;
  nestedMetadata?: ClassMetadata;
}

export class PropertyMetadata<T = any> {
  private constructor(
    public readonly Target: Constructor<T>,
    public readonly propertyName: string,
    public readonly targetName: string,
    public readonly nested?: () => any,
    public readonly isNested?: boolean,
    public readonly isArray?: boolean,
    public readonly nestedType?: Constructor,
    public readonly nestedMetadata?: ClassMetadata,
    public readonly type?: Type,
    public readonly shouldCreateValue?: boolean
  ) {
    if (this.type && !(this.type instanceof Type)) {
      InternalError.throw(`Invalid type for property "${this.propertyName}"`);
    }

    if (this.shouldCreateValue === true && !this.type) {
      InternalError.throw(
        `${this.constructor.name}.${this.propertyName} cannot have "create" be true without a valid "type"`
      );
    }
  }

  create(value?: any): any {
    return this.create ? this.type.create(value) : value;
  }

  static create(options: PropertyMetadataOptions) {
    return new PropertyMetadata(
      options.Target,
      options.propertyName,
      options.targetName,
      options.nested,
      options.isNested,
      options.isArray,
      options.nestedType,
      options.nestedMetadata,
      options.type,
      options.create === true
    );
  }
}
