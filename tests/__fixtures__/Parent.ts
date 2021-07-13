import { ObjectId } from 'mongodb';
import { Sibling } from './Sibling';
import { Property } from '../../src';

export class Parent {
  @Property()
  _id: ObjectId;

  @Property(() => Sibling)
  sibling: Sibling;

  @Property(() => [Sibling])
  siblings: Sibling[] = [];
}
