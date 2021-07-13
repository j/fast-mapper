import { Type } from './Type';

export class StringType extends Type<string> {
  get name(): string {
    return 'string';
  }

  toClassValue(value: string): string {
    return `${value}`;
  }

  toPlainValue(value: string): string {
    return `${value}`;
  }

  isType(type: any): boolean {
    return type === String;
  }
}
