import { Binary } from 'mongodb';
import { v4, stringify, parse, validate } from 'uuid';
import { Type } from '../../src';

export class UUIDType extends Type<string, Binary> {
  get name(): string {
    return 'uuid';
  }

  create(uuid?: string): string {
    if (typeof uuid === 'undefined') {
      return v4();
    }

    this.assertValidClassValue(uuid);

    return uuid;
  }

  toClassValue(uuid: Binary): string | undefined {
    if (typeof uuid === 'string') {
      this.assertValidClassValue(uuid);

      return uuid as string;
    }

    this.assertValidPlainValue(uuid);

    return stringify(uuid.buffer);
  }

  toPlainValue(uuid: Binary | string): Binary | undefined {
    if (typeof uuid === 'undefined' || this.isValidPlainValue(uuid as Binary)) {
      return uuid as Binary;
    }

    this.assertValidClassValue(uuid as string);

    return new Binary(
      Buffer.from(parse(uuid as string) as any),
      Binary.SUBTYPE_UUID
    );
  }

  toJSON(uuid: Binary | string): string {
    return this.toClassValue(uuid);
  }

  isValidClassValue(uuid: string): boolean {
    return typeof uuid === 'string' && validate(uuid);
  }

  isValidPlainValue(uuid: Binary): boolean {
    return uuid && uuid.sub_type === Binary.SUBTYPE_UUID;
  }
}
