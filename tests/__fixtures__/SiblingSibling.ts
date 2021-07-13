import { Sibling } from './Sibling';
import { Parent as ParentHydratable } from './Parent';
import { Property, Parent } from '../../src';

export class SiblingSibling {
  @Parent()
  parent?: Sibling;

  @Property()
  name: string;

  get rootParent(): ParentHydratable {
    return this.parent.parent;
  }
}
