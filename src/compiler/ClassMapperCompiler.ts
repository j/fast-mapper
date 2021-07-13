import { ClassMetadata, PropertyMetadata } from '../metadata';
import { createGenerator, FunctionGenerator } from '../utils/generator';

export enum ClassMapperCompilerType {
  Class,
  Props,
  Plain,
  JSON
}

export type CompiledClassMapper<T = any, S = T> = (
  target: T,
  source: S,
  parent?: any
) => T;

export interface ClassMapperCompilerCompileOptions {
  method: string;
  source: ClassMapperCompilerType;
  target: ClassMapperCompilerType;
  targetFactoryCode(generator: FunctionGenerator<CompiledClassMapper>): string;
}

export class ClassMapperCompiler<T = any> {
  private readonly generator: FunctionGenerator<CompiledClassMapper>;

  constructor(public readonly metadata: ClassMetadata<T>) {
    this.generator = createGenerator();
  }

  public compile(
    options: ClassMapperCompilerCompileOptions
  ): CompiledClassMapper {
    this.generator.context('Target', this.metadata.Target, '', false);

    if (this.metadata.discriminator) {
      return this.generator.generate(`
        return function (target, source, parent) {
          ${this.getDiscriminatorCode(options)}
        }
      `);
    }

    return this.generator.generate(`
      return function (target, source, parent) {
        target = typeof target !== 'undefined' ? target : ${options.targetFactoryCode(
          this.generator
        )};
        
        if (typeof source === 'object') {
          ${this.getPropertiesCode(options)}
        }
        
        ${this.getParentMappingCode(options)}
        
        return target;
      }
    `);
  }

  private getDiscriminatorCode(
    options: ClassMapperCompilerCompileOptions
  ): string {
    const discriminatorMap = this.generator.context(
      `${this.metadata.discriminator.Target.name}Discriminator`,
      this.metadata.discriminator,
      '.mapping'
    );

    const sourceProperty = this.propertyForType(
      options.source,
      this.metadata.discriminator
    );

    return `
      return '${sourceProperty}' in source && ${discriminatorMap}.has(source['${sourceProperty}'])
        ? ${discriminatorMap}.get(source['${sourceProperty}']).getMapper().mappers.${options.method}(undefined, source, parent)
        : undefined;
    `;
  }

  private getParentMappingCode(
    options: ClassMapperCompilerCompileOptions
  ): string {
    if (
      options.target !== ClassMapperCompilerType.Class ||
      !this.metadata.parent?.propertyName
    ) {
      return '';
    }

    const propertyName = this.metadata.parent.propertyName;

    return `if (target instanceof Target) { target['${propertyName}'] = parent; }`;
  }

  private getPropertiesCode(
    options: ClassMapperCompilerCompileOptions
  ): string {
    return [...this.metadata.properties.values()]
      .map((propertyMetadata) => {
        const sourceName = this.propertyForType(
          options.source,
          propertyMetadata
        );
        const targetName = this.propertyForType(
          options.target,
          propertyMetadata
        );

        const accessor = `source["${sourceName}"]`;
        const setter = `target["${targetName}"]`;

        return !propertyMetadata.isNested
          ? this.fieldCode(options, accessor, setter, propertyMetadata)
          : this.nestedCode(options, accessor, setter, propertyMetadata);
      })
      .join('');
  }

  private fieldCode(
    options: ClassMapperCompilerCompileOptions,
    accessor: string,
    setter: string,
    propertyMetadata: PropertyMetadata
  ): string {
    const { propertyName, shouldCreateValue } = propertyMetadata;

    // use raw value if field does not have a "type"
    if (!propertyMetadata.type) {
      return `
        if (typeof ${accessor} !== 'undefined') {
          ${setter} = ${accessor};
        }
      `;
    }
    const type = this.generator.context(
      `${propertyName}Type`,
      propertyMetadata.type
    );

    let createCode: string = '';
    if (shouldCreateValue) {
      const created = this.generator.property(`${propertyName}Value`);

      createCode = `
        if (typeof ${accessor} === 'undefined') {
          ${
            propertyMetadata.isArray
              ? `const ${created} = [${type}.create()];`
              : `const ${created} = ${type}.create();`
          }
          
          if (typeof ${created} !== 'undefined') {
            ${accessor} = ${created};
          }
        }
      `;
    }

    const transformType = `${type}.${this.propertyTypeFunction(
      options.target
    )}`;

    return `
      ${createCode}
      
      if (typeof ${accessor} !== 'undefined') {
        if (Array.isArray(${accessor})) {
          ${setter} = ${accessor}.map(v => {
            if (typeof v === 'undefined') {
              return undefined;
            }

            return ${transformType}(v);
          });
        } else {
          ${setter} = ${transformType}(${accessor});
        }
      }
    `;
  }

  private nestedCode(
    options: ClassMapperCompilerCompileOptions,
    accessor: string,
    setter: string,
    propertyMetadata: PropertyMetadata
  ): string {
    const { nestedMetadata, isArray, propertyName } = propertyMetadata;

    const mapper = this.generator.context(
      `${propertyName}ClassMapper`,
      nestedMetadata.getMapper(),
      `.mappers.${options.method}`
    );

    const code = isArray
      ? `
        if (Array.isArray(${accessor})) {
          ${setter} = ${accessor}.map(value => ${mapper}(undefined, value, target));
        }
      `
      : `${setter} = ${mapper}(undefined, ${accessor}, target);`;

    return `
      // bypass null & undefined values
      if (typeof ${accessor} === 'undefined') {
        // ignore undefined values
      } else if (${accessor} === null) {
        ${setter} = null;
      } else {
        ${code}
      }
    `;
  }

  private propertyForType(
    type: ClassMapperCompilerType,
    metadata: { propertyName: string; targetName: string }
  ): string {
    switch (type) {
      case ClassMapperCompilerType.Class:
      case ClassMapperCompilerType.JSON:
      case ClassMapperCompilerType.Props:
        return metadata.propertyName;
      case ClassMapperCompilerType.Plain:
        return metadata.targetName;
      default:
        throw new Error(
          `Property name for "${ClassMapperCompilerType[type]}" does not exist`
        );
    }
  }

  private propertyTypeFunction(type: ClassMapperCompilerType): string {
    switch (type) {
      case ClassMapperCompilerType.Class:
      case ClassMapperCompilerType.Props:
        return 'toClassValue';
      case ClassMapperCompilerType.Plain:
        return 'toPlainValue';
      case ClassMapperCompilerType.JSON:
        return 'toJSON';
      default:
        throw new Error(
          `Type function for "${ClassMapperCompilerType[type]}" does not exist`
        );
    }
  }
}
