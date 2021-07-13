import { ValidationError } from '../errors';

export abstract class Type<
  Class = any,
  Plain = Class,
  JSON = Plain,
  Other = Class
> {
  /**
   * The name of the field type.
   */
  abstract get name(): string;

  /**
   * Creates the class property value.  Normally you want to support potential JSON values
   * to create the type's value from it's JSON representation.
   */
  create(value?: Class | Plain | Other): Class {
    return value as Class;
  }

  /**
   * Converts the value to the class property value.
   */
  toClassValue(value: Class | Plain | Other): Class {
    return value as Class;
  }

  /**
   * Converts from the class property value to the destination value.
   */
  toPlainValue(value: Class | Plain | Other): Plain {
    return value as Plain;
  }

  /**
   * Converts to the JSON value.
   */
  toJSON(value: Class | Plain | JSON | Other): JSON {
    return this.toPlainValue(value as Class) as any as JSON;
  }

  /**
   * Converts from the JSON value.
   */
  fromJSON(value: JSON): Class {
    return this.toClassValue(value as any as Plain) as any as Class;
  }

  /**
   * Checks if class value is valid
   *
   */
  // eslint-disable-next-line
  isValidClassValue(_value?: Class | Other): boolean {
    return true;
  }

  /**
   * Checks if plain value is valid.
   */
  // eslint-disable-next-line
  isValidPlainValue(_value?: Plain | Other): boolean {
    return true;
  }

  /**
   * Throws error if class value is invalid.
   */
  assertValidClassValue(
    value: Class | Other,
    mode: 'class' | 'plain' | 'json' = 'class'
  ): void {
    if (!this.isValidClassValue(value)) {
      ValidationError.invalidType(this, value, mode);
    }
  }

  /**
   * Throws error if plain value is invalid.
   */
  assertValidPlainValue(
    value: Plain | Other,
    mode: 'class' | 'plain' | 'json' = 'plain'
  ): void {
    if (!this.isValidPlainValue(value)) {
      ValidationError.invalidType(this, value, mode);
    }
  }

  /**
   * Uses reflection to determine the design type
   */
  isType(type: any): boolean { // eslint-disable-line
    return false;
  }
}
