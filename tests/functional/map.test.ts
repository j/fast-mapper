import 'reflect-metadata';
import {
  Simple,
  createSimpleProps,
  createSimple
} from '../__fixtures__/Simple';
import {
  User,
  createUsers,
  Address,
  Review,
  Product,
  createUserProps
} from '../__fixtures__/User';
import { ObjectId } from 'mongodb';
import { UUIDType } from '../__fixtures__/UUIDType';
import { map, mapper, registerType, PartialDeep } from '../../src';
import { Parent } from '../__fixtures__/Parent';
import { Sibling } from '../__fixtures__/Sibling';
import { SiblingSibling } from '../__fixtures__/SiblingSibling';
import { Inheritance } from '../__fixtures__/Inheritance';
import { ObjectIdType } from '../__fixtures__/ObjectIdType';

registerType(new ObjectIdType());
registerType(new UUIDType());

describe('map', () => {
  describe('fromPlain', () => {
    test('creates an object of Simple', () => {
      const fields = {
        _id: new ObjectId(),
        string: 'foo',
        date: new Date('1986-12-05'),
        boolean: false
      };

      const simple = map(Simple).fromPlain(fields);

      expect(simple).toBeInstanceOf(Simple);
      expect(simple).toEqual(Object.assign(new Simple(), fields));
    });

    test('creates Date from date string', () => {
      const simple = map(Simple).fromPlain({
        date: '2021-07-12T23:43:23.138Z'
      });
      expect(simple).toBeInstanceOf(Simple);
      expect(simple.date).toBeInstanceOf(Date);
      expect(simple.date.toISOString()).toEqual('2021-07-12T23:43:23.138Z');
    });

    test('creates an object of User', () => {
      const user = createUsers().john;
      const result = map(User).fromPlain({
        _id: user._id,
        uid: new UUIDType().toPlainValue(
          '00000000-a000-4000-8900-000000000000'
        ),
        name: 'John',
        address: {
          city: 'San Diego',
          state: 'CA'
        },
        reviews: [
          { product: { sku: '1', title: 'Poster' }, rating: 10 },
          { product: { sku: '2', title: 'Frame' }, rating: 5 }
        ],
        topReviews: ['393967e0-8de1-11e8-9eb6-529269fb1459'],
        bestFriends: [new ObjectId('507f191e810c19729de860ea')],
        isActive: true,
        createdAt: user.createdAt
      });
      expect(result).toBeInstanceOf(User);
      expect(result.uuid).toEqual('00000000-a000-4000-8900-000000000000');
      expect(result.address).toBeInstanceOf(Address);
      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0]).toBeInstanceOf(Review);
      expect(result.reviews[0].product).toBeInstanceOf(Product);
      expect(result.reviews[1]).toBeInstanceOf(Review);
      expect(result.reviews[1].product).toBeInstanceOf(Product);
      expect(result.topReviews).toEqual([
        '393967e0-8de1-11e8-9eb6-529269fb1459'
      ]);
      expect(result.bestFriends).toHaveLength(1);
      expect(result.bestFriends[0]).toBeInstanceOf(ObjectId);
      expect(result.bestFriends[0].toHexString()).toEqual(
        '507f191e810c19729de860ea'
      );
    });

    test('creates nested class', () => {
      const fields = {
        city: 'San Diego',
        state: 'CA'
      };
      const address = map(Address).fromPlain(fields);
      expect(address).toBeInstanceOf(Address);
      expect(address).toEqual(Object.assign(new Address(), fields));
    });
  });

  describe('toPlain', () => {
    test('converts Simple to plain', () => {
      const result = map(Simple).toPlain(createSimple());
      expect(result).toEqual(createSimpleProps());
    });

    test('converts User to plain', () => {
      const users = createUsers();

      const result = map(User).toPlain(users.john);
      expect(result.address instanceof Address).toBeFalsy();
      expect(result.reviews).toHaveLength(2);
      expect(result).toEqual({
        _id: users.john._id,
        uid: new UUIDType().toPlainValue(
          '00000000-a000-4000-8900-000000000000'
        ),
        name: 'John',
        address: {
          city: 'San Diego',
          state: 'CA'
        },
        reviews: [
          { uid: new UUIDType().toPlainValue('00000000-a000-4000-8900-000000000002'), product: { sku: '1', title: 'Poster' }, rating: 10 },
          { uid: new UUIDType().toPlainValue('00000000-a000-4000-8900-000000000003'), product: { sku: '2', title: 'Frame' }, rating: 5 }
        ],
        topReviews: [new UUIDType().toPlainValue('00000000-a000-4000-8900-000000000002')],
        bestFriends: [new ObjectId('60e8bfdf84977143869267d1')],
        isActive: true,
        createdAt: users.john.createdAt
      });
    });

    test('converts nested class to plain', () => {
      const result = map(Address).toPlain(createUsers().john.address);
      expect(result instanceof Address).toBeFalsy();
      expect(result).toEqual({
        city: 'San Diego',
        state: 'CA'
      });
    });

    test('ignores undefined nested classes', () => {
      const user = map(User).fromPlain({
        _id: new ObjectId(),
        name: 'John'
        // before, this would be populated as an empty address object
        // address: undefined
      });

      const result = map(User).toPlain(user);
      expect(result).toEqual({
        _id: user._id,
        name: 'John',
        reviews: []
      });

      expect(result.address).toBeUndefined();
    });
  });

  describe('toProps', () => {
    test('maps Simple to props', () => {
      const simple = map(Simple).toProps(createSimple());
      expect(simple instanceof Simple).toBeFalsy();
      expect(simple).toEqual(createSimpleProps());
    });

    test('maps User to props', () => {
      const user = map(User).toProps(createUsers().john);
      expect(user instanceof User).toBeFalsy();
      expect(user._id).toBeInstanceOf(ObjectId);
      expect(user).toEqual(createUserProps().john);
      expect(user.address instanceof Address).toBeFalsy();
      user.reviews.map((review) =>
        expect(review instanceof Review).toBeFalsy()
      );
    });
  });

  describe('Parent()', () => {
    const props = {
      sibling: {
        name: 'John',
        sibling: { name: 'Jack' },
        siblings: [{ name: 'Nick' }]
      },
      siblings: [
        {
          name: 'Betty',
          sibling: { name: 'Jack' },
          siblings: [{ name: 'Nick' }]
        }
      ]
    };

    function assertValidParent(parent: PartialDeep<Parent>) {
      expect(parent.sibling).toBeInstanceOf(Sibling);
      expect(parent.sibling?.parent).toBe(parent);

      expect(parent.siblings).toHaveLength(1);
      expect(parent.siblings?.[0]?.parent).toBeInstanceOf(Parent);
      expect(parent.siblings?.[0]?.parent).toBe(parent);

      expect(parent.sibling?.sibling).toBeInstanceOf(SiblingSibling);
      expect(parent.sibling?.sibling?.parent).toBeInstanceOf(Sibling);
      expect(parent.sibling?.sibling?.parent).toBe(parent.sibling);

      expect(parent.sibling?.siblings).toHaveLength(1);
      expect(parent.sibling?.siblings?.[0]).toBeInstanceOf(SiblingSibling);
      expect(parent.sibling?.siblings?.[0]?.parent).toBeInstanceOf(Sibling);
      expect(parent.sibling?.siblings?.[0]?.parent).toBe(parent.sibling);

      // why not
      expect(parent.sibling?.parent?.sibling?.sibling).toBe(
        parent.sibling?.sibling
      );
      expect(parent.sibling?.sibling?.rootParent).toBe(parent);
    }

    test('maps @Parent() using "create"', () => {
      assertValidParent(map(Parent).create(props));
    });

    test('maps @Parent() using "fromPlain"', () => {
      assertValidParent(map(Parent).fromPlain(props));
    });
  });

  test('inheritance metadata', () => {
    const meta = mapper.getMetadataFor(Inheritance);

    expect(meta.properties.get('_id')).toBeDefined();
    expect(meta.properties.get('base')).toBeDefined();
    expect(
      meta.properties.get('sibling')?.nestedMetadata?.properties.get('base')
    ).toBeDefined();
    expect(
      meta.properties.get('sibling')?.nestedMetadata?.properties.get('baseBase')
    ).toBeDefined();
  });

  describe('toJSON / fromJSON', () => {
    test('converts simple data to json and back', () => {
      const json = map(Simple).toJSON({
        date: new Date('2021-07-12T23:43:23.138Z')
      });
      expect(json instanceof Simple).toBeFalsy();
      expect(typeof json.date).toBe('string');
      expect(json.date).toEqual('2021-07-12T23:43:23.138Z');

      const simple = map(Simple).fromJSON(json);
      expect(simple).toBeInstanceOf(Simple);
      expect(simple.date).toBeInstanceOf(Date);
      expect(simple.date.toISOString()).toEqual('2021-07-12T23:43:23.138Z');
    });

    test('converts user to json and back', () => {
      const john = createUsers().john;

      const json = map(User).toJSON(john);

      expect(json instanceof User).toBeFalsy();
      expect(json.uuid).toEqual('00000000-a000-4000-8900-000000000000');
      expect(json.address instanceof Address).toBeFalsy();
      expect(json.reviews).toHaveLength(2);
      expect(json.reviews[0] instanceof Review).toBeFalsy();
      expect(json.reviews[0].product instanceof Product).toBeFalsy()
      expect(json.reviews[1] instanceof Review).toBeFalsy()
      expect(json.reviews[1].product instanceof Product).toBeFalsy()
      expect(json.topReviews).toEqual([
        '00000000-a000-4000-8900-000000000002'
      ]);
      expect(typeof json.topReviews[0]).toBe('string');
      expect(json.bestFriends).toHaveLength(1);
      expect(typeof json.bestFriends[0]).toBe('string');
      expect(json.bestFriends[0]).toEqual(
        '60e8bfdf84977143869267d1'
      );

      const user = map(User).fromJSON(json);
      expect(user).toEqual(john);
      expect(user).toBeInstanceOf(User);
      expect(user.address).toBeInstanceOf(Address);
      expect(user.reviews[0]).toBeInstanceOf(Review);
      expect(user.reviews[0].product).toBeInstanceOf(Product);
      expect(user.reviews[1]).toBeInstanceOf(Review);
      expect(user.reviews[1].product).toBeInstanceOf(Product);
      expect(typeof user.topReviews[0]).toBe('string');
      expect(user.bestFriends[0]).toBeInstanceOf(ObjectId);
    });
  });
});
