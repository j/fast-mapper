import { DiscriminatorDefinition } from './definitions';
import { ClassMetadata } from './ClassMetadata';
import { Constructor } from '../typings';
import { InternalError } from '../errors';
import { ClassMetadataFactory } from './ClassMetadataFactory';

export class DiscriminatorMetadata {
  readonly Target: Constructor;
  readonly propertyName: string;
  readonly targetName: string;

  constructor(
    public readonly factory: ClassMetadataFactory,
    public readonly definition: DiscriminatorDefinition,
    public readonly mapping: Map<string, ClassMetadata>
  ) {
    this.Target = definition.Target;
    this.propertyName = definition.propertyName;

    DiscriminatorMetadata.assertValid(factory, definition);

    // get targetName from fields storage
    this.targetName = this.factory.definitions.properties
      .get(this.Target)
      .get(this.propertyName).targetName;
  }

  static assertValid(
    factory: ClassMetadataFactory,
    definition: DiscriminatorDefinition
  ) {
    const { Target, propertyName } = definition;

    const fieldsDef = factory.definitions.properties.get(Target);
    if (!fieldsDef || !fieldsDef.has(propertyName)) {
      InternalError.throw(
        `@Discriminator() classes must have a decorated @Field() property with name "${propertyName}"`
      );
    }
  }
}
