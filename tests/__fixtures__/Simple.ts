import { ObjectId } from 'mongodb';
import { Property } from '../../src';

export class Simple {
  @Property()
  _id: ObjectId;

  @Property()
  string: string;

  @Property()
  date: Date = new Date();

  @Property()
  boolean: boolean = true;

  unmapped?: string;
}

export function createSimpleProps(): Partial<Simple> {
  return {
    _id: new ObjectId('60e4d63e08d5cf27245e5618'),
    string: 'foo',
    date: new Date('1986-12-05'),
    boolean: false
  };
}

export function createSimple(): Simple {
  return Object.assign(new Simple(), createSimpleProps());
}
