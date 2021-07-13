import { Constructor, PartialDeep } from '../typings';
import { DiscriminatorMetadata } from './DiscriminatorMetadata';
import { ParentDefinition } from './definitions';
import { PropertyMetadata } from './PropertyMetadata';
import { ClassMapper } from '../mappers';

export class ClassMetadata<Class = any, Plain = PartialDeep<Class>> {
  private readonly classMapper: ClassMapper;

  constructor(
    public readonly Target: Constructor<Class>,
    public readonly properties: Map<string, PropertyMetadata>,
    public readonly parent?: ParentDefinition,
    public readonly discriminator?: DiscriminatorMetadata,
    public readonly extensions?: Record<any, any>
  ) {
    this.extensions = this.extensions || {};
    this.classMapper = new ClassMapper(this);
  }

  get name(): string {
    return this.Target.name;
  }

  isRoot(): boolean {
    return !!this.parent;
  }

  getMapper<C = Class, P = Plain>(): ClassMapper<C, P> {
    return this.classMapper;
  }
}
