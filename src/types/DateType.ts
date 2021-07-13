import { Type } from './Type';

type PossibleDateTypes = Date | string | number;

export class DateType extends Type<Date, Date, PossibleDateTypes> {
  get name(): string {
    return 'date';
  }

  create(value?: PossibleDateTypes): Date {
    if (typeof value === 'undefined') {
      return new Date();
    }

    const date = new Date(value);

    this.assertValidClassValue(date);

    return date;
  }

  toClassValue(value: PossibleDateTypes): Date {
    return this.createDate(value, (d) => this.assertValidClassValue(d));
  }

  toPlainValue(value: PossibleDateTypes): Date {
    return this.createDate(value, (d) => this.assertValidPlainValue(d));
  }

  toJSON(value: Date | PossibleDateTypes): PossibleDateTypes {
    if (!(value instanceof Date)) {
      value = this.toClassValue(value);
    }

    return value.toISOString();
  }

  createDate(value: PossibleDateTypes, validate: (value: any) => void): Date {
    if (value instanceof Date) {
      return value;
    }

    const date = new Date(value);

    validate(date);

    return date;
  }

  isValidClassValue(date?: Date | string): boolean {
    return this.isValidDate(date);
  }

  isValidPlainValue(date?: Date | string): boolean {
    return this.isValidDate(date);
  }

  isValidDate(date: Date | string): boolean {
    if (typeof date === 'string') {
      date = new Date(date);
    }

    return date instanceof Date && !isNaN(date.getTime());
  }

  isType(type: any): boolean {
    return type === Date;
  }
}
