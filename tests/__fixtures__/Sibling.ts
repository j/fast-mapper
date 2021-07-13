import { Parent as ParentHydratable } from './Parent';
import { SiblingSibling } from './SiblingSibling';
import { Property, Parent } from '../../src';

export class Sibling {
  @Parent()
  parent?: ParentHydratable;

  @Property()
  name: string;

  @Property(() => SiblingSibling)
  sibling: SiblingSibling;

  @Property(() => [SiblingSibling])
  siblings: SiblingSibling[] = [];
}
