import {
  ClassMapperCompiler,
  ClassMapperCompilerType,
  CompiledClassMapper
} from '../compiler';

import type { ClassMetadata } from '../metadata';
import { PartialDeep } from '../typings';

interface CompiledMappers {
  create: CompiledClassMapper;
  fromPlain: CompiledClassMapper;
  toPlain: CompiledClassMapper;
  toProps: CompiledClassMapper;
  toJSON: CompiledClassMapper;
  fromJSON: CompiledClassMapper;
}

export class ClassMapper<Class = any, Plain = any, JSON = any> {
  constructor(
    private readonly metadata: ClassMetadata,
    private compiledMappers?: CompiledMappers
  ) {}

  get mappers(): CompiledMappers {
    if (typeof this.compiledMappers === 'object') {
      return this.compiledMappers;
    }

    const compiler = new ClassMapperCompiler(this.metadata);

    this.compiledMappers = {
      create: compiler.compile({
        method: 'create',
        source: ClassMapperCompilerType.Class,
        target: ClassMapperCompilerType.Class,
        targetFactoryCode: () => 'new Target()'
      }),
      fromPlain: compiler.compile({
        method: 'fromPlain',
        source: ClassMapperCompilerType.Plain,
        target: ClassMapperCompilerType.Class,
        targetFactoryCode: () => 'new Target()'
      }),
      toPlain: compiler.compile({
        method: 'toPlain',
        source: ClassMapperCompilerType.Class,
        target: ClassMapperCompilerType.Plain,
        targetFactoryCode: () => '{}'
      }),
      toProps: compiler.compile({
        method: 'toProps',
        source: ClassMapperCompilerType.Class,
        target: ClassMapperCompilerType.Class,
        targetFactoryCode: () => '{}'
      }),
      toJSON: compiler.compile({
        method: 'toJSON',
        source: ClassMapperCompilerType.Class,
        target: ClassMapperCompilerType.JSON,
        targetFactoryCode: () => '{}'
      }),
      fromJSON: compiler.compile({
        method: 'fromJSON',
        source: ClassMapperCompilerType.JSON,
        target: ClassMapperCompilerType.Class,
        targetFactoryCode: () => 'new Target()'
      })
    };

    return this.compiledMappers;
  }

  create<C = Class, Props = PartialDeep<C>>(props: Props): C {
    return this.mappers.create(undefined, props);
  }

  toProps<C = Class, Props = PartialDeep<C>>(instance: C): Props {
    return this.mappers.toProps(undefined, instance);
  }

  fromPlain<P = Plain, C = Class>(obj: P): C {
    return this.mappers.fromPlain(undefined, obj);
  }

  toPlain<C = Class, P = Plain>(instance: C): P {
    return this.mappers.toPlain(undefined, instance);
  }

  toJSON<C = Class, J = JSON>(instance: C): J {
    return this.mappers.toJSON(undefined, instance);
  }

  fromJSON<J = JSON, C = Class>(instance: J): C {
    return this.mappers.fromJSON(undefined, instance);
  }
}
