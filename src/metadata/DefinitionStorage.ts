import { Constructor } from '../typings';
import {
  ClassDefinition,
  DiscriminatorDefinition,
  ParentDefinition,
  PropertyDefinition
} from './definitions';
import { InternalError } from '../errors';
import { ClassMetadataFactory } from './ClassMetadataFactory';

type PropertyName = string;
type ClassStorage = Map<Constructor, ClassDefinition>;
type PropertyStorage = Map<Constructor, Map<PropertyName, PropertyDefinition>>;
type ParentStorage = Map<Constructor, ParentDefinition>;
type DiscriminatorStorage = Map<Constructor, DiscriminatorDefinition>;

export interface DefineClassOptions {
  Target: Constructor;
}

export interface DefinePropertyOptions {
  target: any;
  propertyName: string;
  name?: string;
  nested?: () => any;
  type?: string;
  extensions?: Record<any, any>;
  create?: boolean;
  context?: string;
}

export interface DefineParentOptions {
  Target: Constructor;
  propertyName: string;
}

export interface DefineDiscriminatorAbstractClassOptions {
  Target: any;
  property: string;
  context?: string;
}

export interface DefineDiscriminatorValueOptions {
  Target: any;
  value: string;
  context?: string;
}

export type DefineDiscriminatorOptions =
  | DefineDiscriminatorAbstractClassOptions
  | DefineDiscriminatorValueOptions;

export class DefinitionStorage {
  public readonly classes: ClassStorage = new Map();
  public readonly properties: PropertyStorage = new Map();
  public readonly parents: ParentStorage = new Map();
  public readonly discriminators: DiscriminatorStorage = new Map();

  defineClass(options: DefineClassOptions) {
    const { Target } = options;

    this.classes.set(Target, { Target });
  }

  defineProperty(options: DefinePropertyOptions) {
    const { target, propertyName, nested } = options;

    const Target = target.constructor;

    if (!this.classes.has(Target)) {
      this.defineClass({ Target });
    }

    const designType = Reflect.getMetadata('design:type', target, propertyName);

    const propertyDefinition: PropertyDefinition = {
      ...options,
      Target,
      propertyName,
      targetName: options.name || propertyName,
      isNested: typeof nested !== 'undefined',
      nested,
      type: (factory: ClassMetadataFactory) =>
        options.type
          ? factory.mapper.getType(options.type)
          : factory.locateType(designType),
      isArray: designType === Array,
      create: typeof options.create === 'boolean' ? options.create : false
    };

    if (
      propertyDefinition.type &&
      propertyDefinition.isArray &&
      propertyDefinition.create
    ) {
      InternalError.throw(
        `Option "create" is not supported for array types for property "${propertyDefinition.propertyName}" in "${Target.name}"`
      );
    }

    if (this.properties.has(Target)) {
      this.properties.get(Target).set(propertyName, propertyDefinition);
    } else {
      this.properties.set(
        Target,
        new Map([[propertyName, propertyDefinition]])
      );
    }
  }

  defineParent(options: DefineParentOptions) {
    const { Target, propertyName } = options;

    if (this.parents.has(Target)) {
      InternalError.throw(`Parent already exists for "${Target}"`);
    }

    this.parents.set(Target, {
      Target,
      propertyName
    });
  }

  defineDiscriminator(options: DefineDiscriminatorOptions) {
    const Target = options.Target;

    // this is the base abstract discriminator
    if ('property' in options) {
      const discriminatorDefinition: DiscriminatorDefinition = {
        Target,
        propertyName: options.property,
        isMapped: true,
        map: {}
      };

      this.discriminators.set(Target, {
        ...(this.discriminators.get(Target) || {}),
        ...discriminatorDefinition
      });
    } else {
      let discriminatorDefinition: DiscriminatorDefinition;

      // Locate `@Discriminator()` decorated abstract class.
      let proto = Object.getPrototypeOf(Target);
      while (proto && proto.prototype) {
        discriminatorDefinition = this.discriminators.get(proto);
        if (discriminatorDefinition) {
          break;
        }

        proto = Object.getPrototypeOf(proto);
      }

      if (!discriminatorDefinition) {
        InternalError.throw(
          `Discriminator value "${Target.name}" does not have a properly mapped base "@Discriminator()"`
        );
      }

      discriminatorDefinition.map[options.value] = () => Target;
    }
  }
}
