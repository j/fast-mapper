import 'reflect-metadata';
import {
  DefineDiscriminatorAbstractClassOptions,
  DefineDiscriminatorOptions,
  DefineDiscriminatorValueOptions,
  DefinePropertyOptions,
  DefinitionStorage
} from '../metadata';

export type PropertyDecoratorOptions = Omit<
  DefinePropertyOptions,
  'target' | 'propertyName' | 'nested'
>;
export type DiscriminatorDecoratorOptions =
  | Omit<DefineDiscriminatorAbstractClassOptions, 'Target'>
  | Omit<DefineDiscriminatorValueOptions, 'Target'>;

export interface Decorators {
  Property(
    nested?: () => any,
    options?: PropertyDecoratorOptions
  ): PropertyDecorator;
  Property(
    options?: PropertyDecoratorOptions,
    _ignored?: any
  ): PropertyDecorator;
  Parent(): PropertyDecorator;
  Discriminator(options: DiscriminatorDecoratorOptions): ClassDecorator;
}

export function createDecorators(
  definitionStorage: DefinitionStorage
): Decorators {
  return {
    Property(nestedOrOptions, options): PropertyDecorator {
      return (target: any, propertyName: string) => {
        let nested: () => any;

        if (typeof nestedOrOptions === 'function') {
          nested = nestedOrOptions;
          options = options || {};
        } else {
          options = nestedOrOptions || {};
        }

        definitionStorage.defineProperty({
          ...options,
          target,
          propertyName,
          nested
        });
      };
    },
    Parent(): PropertyDecorator {
      return (target: any, propertyName: string) => {
        definitionStorage.defineParent({
          Target: target.constructor,
          propertyName
        });
      };
    },
    Discriminator(options: DiscriminatorDecoratorOptions): ClassDecorator {
      return (Target: any) => {
        definitionStorage.defineDiscriminator({
          Target,
          ...(options as DefineDiscriminatorOptions)
        });
      };
    }
  };
}
