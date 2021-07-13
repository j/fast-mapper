import { Constructor } from '../typings';
import { Type } from '../types';
import { ClassMetadataFactory } from './ClassMetadataFactory';

export interface ClassDefinition<T = any> {
  Target: Constructor<T>;
  extensions?: Record<any, any>;
}

export interface PropertyDefinition<T = any> {
  Target: Constructor<T>;
  type?: (factory: ClassMetadataFactory) => Type;
  isArray: boolean;
  create: boolean;
  propertyName: string;
  targetName: string;
  isNested: boolean;
  nested?: () => any;
  extensions?: Record<any, any>;
}

export interface ParentDefinition<T = any> {
  Target: Constructor<T>;
  propertyName: string;
}

export interface DiscriminatorDefinition<T = any> {
  Target: Constructor<T>;
  isMapped?: boolean;
  propertyName?: string;
  targetName?: string;
  map: Record<string, () => Constructor>;
}
