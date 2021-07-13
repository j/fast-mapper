import { ObjectId } from 'mongodb';
import { Property } from '../../src';

export abstract class BaseBaseHydratable {
  @Property()
  _id: ObjectId;
}

export abstract class BaseHydratable extends BaseBaseHydratable {
  @Property()
  base: string;
}

export abstract class BaseBaseSibling {
  @Property()
  baseBase: string;
}

export abstract class BaseSibling extends BaseBaseSibling {
  @Property()
  base: string;
}

export abstract class Sibling extends BaseSibling {
  @Property()
  field: string;
}

export class Inheritance extends BaseHydratable {
  @Property(() => Sibling)
  sibling: Sibling;
}
