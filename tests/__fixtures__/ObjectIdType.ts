import { ObjectId } from 'mongodb';
import { Type } from '../../src';

export class ObjectIdType extends Type<ObjectId, ObjectId, string> {
  get name(): string {
    return 'ObjectId';
  }

  create(id?: ObjectId | string): ObjectId {
    if (typeof id === 'undefined') {
      return new ObjectId();
    }

    this.assertValidClassValue(id as ObjectId);

    return new ObjectId(id);
  }

  toClassValue(id: ObjectId): ObjectId | undefined {
    this.assertValidPlainValue(id);

    return new ObjectId(id);
  }

  toPlainValue(id: ObjectId | string): ObjectId | undefined {
    this.assertValidClassValue(id as ObjectId);

    return new ObjectId(id);
  }

  toJSON(id: ObjectId | string): string {
    if (typeof id === 'string') {
      return id;
    }

    return id.toHexString();
  }

  isValidClassValue(id: ObjectId | string): boolean {
    return ObjectId.isValid(id);
  }

  isValidPlainValue(id: ObjectId | string): boolean {
    return ObjectId.isValid(id);
  }

  isType(type: any): boolean {
    return type?.name?.toLowerCase() === 'objectid';
  }
}
