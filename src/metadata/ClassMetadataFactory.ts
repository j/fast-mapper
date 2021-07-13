import { ClassMetadata } from './ClassMetadata';
import { PropertyMetadata } from './PropertyMetadata';
import { Constructor, Maybe } from '../typings';
import { DiscriminatorMetadata } from './DiscriminatorMetadata';
import { ParentDefinition } from './definitions';
import { InternalError } from '../errors';
import { DefinitionStorage } from './DefinitionStorage';
import { Mapper } from '../mappers';
import { Type } from '../types';

export class ClassMetadataFactory {
  public readonly cachedMetadata = new Map<Constructor, ClassMetadata>();
  public readonly cachedDiscriminatorMetadata = new Map<
    Constructor,
    DiscriminatorMetadata
  >();

  constructor(
    public readonly mapper: Mapper,
    public readonly definitions: DefinitionStorage,
    public readonly registeredTypes: Map<string, Type>
  ) {}

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  getMetadataFor<T>(Target: Constructor<T>): ClassMetadata<T> {
    let meta = this.cachedMetadata.get(Target);

    if (!meta) {
      meta = this.buildMetadataForClass(Target);

      this.cachedMetadata.set(Target, meta);
    }

    return meta;
  }

  /**
   * Filters metadata by given criteria.
   */
  filterMetadata<T = any>(
    filter: (value: ClassMetadata) => boolean
  ): ClassMetadata<T>[] {
    return Array.from(this.cachedMetadata.values()).filter(filter);
  }

  /**
   * Filters metadata by given criteria.
   */
  map<T = any>(
    fn: (value: ClassMetadata, index: number, array: ClassMetadata[]) => T
  ): T[] {
    return Array.from(this.cachedMetadata.values()).map(fn);
  }

  // -------------------------------------------------------------------------
  // Protected Methods
  // -------------------------------------------------------------------------

  /**
   * Builds the ClassMetadata and it's properties for the given class.
   */
  protected buildMetadataForClass<T = any>(
    Target: Constructor<T>
  ): ClassMetadata<T> {
    if (!this.definitions.classes.has(Target)) {
      InternalError.throw(`"${Target.name}" is not a decorated @Document()`);
    }

    const { extensions } = this.definitions.classes.get(Target);

    return new ClassMetadata(
      Target,
      this.buildPropertyMetadata(Target),
      undefined,
      undefined,
      extensions
    );
  }

  protected buildNestedMetadata(Target: Constructor): ClassMetadata {
    if (this.cachedMetadata.has(Target)) {
      return this.cachedMetadata.get(Target);
    }

    const nestedMetadata = new ClassMetadata(
      Target,
      this.buildPropertyMetadata(Target),
      this.locateParentDefinition(Target),
      this.buildDiscriminatorMetadata(Target)
    );

    this.cachedMetadata.set(Target, nestedMetadata);

    return nestedMetadata;
  }

  /**
   * Recursively adds properties to the ClassMetadata.
   */
  protected buildPropertyMetadata(
    target: Constructor,
    properties?: Map<string, PropertyMetadata>
  ): Map<string, PropertyMetadata> {
    properties = properties || new Map();

    if (this.definitions.properties.has(target)) {
      this.definitions.properties.get(target).forEach((propertyDefinition) => {
        const type = propertyDefinition.type(this);

        if (!propertyDefinition.isNested) {
          properties.set(
            propertyDefinition.propertyName,
            PropertyMetadata.create({
              ...propertyDefinition,
              type,
              isArray: false
            })
          );
        } else {
          let nestedType = propertyDefinition.nested();
          const isArray = Array.isArray(nestedType);
          if (isArray) {
            nestedType = nestedType[0];
          }

          if (propertyDefinition.isArray !== isArray) {
            throw new Error(
              `Property "${propertyDefinition.propertyName}" of type "${nestedType.name}" was defined as an array but type is not a valid array.  Expected "${propertyDefinition.propertyName}: ${nestedType.name}[]".`
            );
          }

          const nestedMetadata = this.buildNestedMetadata(nestedType);

          properties.set(
            propertyDefinition.propertyName,
            PropertyMetadata.create({
              ...propertyDefinition,
              type,
              nestedMetadata,
              nestedType
            })
          );
        }
      });
    }

    // locate inherited decorated properties
    let proto = Object.getPrototypeOf(target);
    while (proto && proto.prototype) {
      if (this.definitions.properties.has(proto)) {
        this.buildPropertyMetadata(proto, properties);
      }

      proto = Object.getPrototypeOf(proto);
    }

    if (!properties.size) {
      // make the error more clear for discriminator mapped classes
      if (this.definitions.discriminators.has(target)) {
        DiscriminatorMetadata.assertValid(
          this,
          this.definitions.discriminators.get(target)
        );
      }

      InternalError.throw(`"${target.name}" does not have any properties`);
    }

    return properties;
  }

  private locateParentDefinition(
    target: Constructor
  ): ParentDefinition | undefined {
    if (this.definitions.parents.get(target)) {
      return this.definitions.parents.get(target);
    }

    // locate inherited `Parent()`
    let proto = Object.getPrototypeOf(target);
    while (proto && proto.prototype) {
      if (this.definitions.parents.get(proto)) {
        return this.definitions.parents.get(proto);
      }

      proto = Object.getPrototypeOf(proto);
    }
  }

  private buildDiscriminatorMetadata(
    target: Constructor
  ): DiscriminatorMetadata | undefined {
    if (!this.definitions.discriminators.has(target)) {
      return;
    }

    if (this.cachedDiscriminatorMetadata.has(target)) {
      return this.cachedDiscriminatorMetadata.get(target);
    }

    const def = this.definitions.discriminators.get(target);
    const map = new Map<string, ClassMetadata>();
    const metadata = new DiscriminatorMetadata(this, def, map);

    this.cachedDiscriminatorMetadata.set(target, metadata);

    Object.keys(def.map).forEach((type) => {
      map.set(type, this.buildNestedMetadata(def.map[type]()));
    });

    return metadata;
  }

  locateType(type: any): Maybe<Type> {
    return [...this.registeredTypes.values()].find((t) => t.isType(type));
  }
}
