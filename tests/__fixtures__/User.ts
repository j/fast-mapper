import { ObjectId } from 'mongodb';
import { Property } from '../../src';

export class Address {
  @Property({ type: 'uuid', name: 'uid' })
  uuid: string;

  @Property()
  city: string;

  @Property()
  state: string;
}

export class Product {
  @Property({ type: 'uuid', name: 'uid' })
  uuid: string;

  @Property()
  sku: string;

  @Property()
  title: string;
}

export class Review {
  @Property({ type: 'uuid', name: 'uid' })
  uuid: string;

  @Property(() => Product)
  product: Product;

  @Property()
  rating: number;

  @Property({ type: 'uuid' })
  productUUIDs: string[];
}

export class User {
  @Property()
  _id: ObjectId;

  @Property({ type: 'uuid', name: 'uid' })
  uuid: string;

  @Property()
  name: string;

  @Property(() => Address)
  address: Address;

  @Property(() => [Review])
  reviews: Review[] = [];

  @Property({ type: 'uuid' })
  topReviews: string[];

  @Property({ type: 'ObjectId' })
  bestFriends: ObjectId[];

  @Property()
  createdAt: Date;

  @Property()
  isActive: boolean;
}

export function createUserProps(): { john: any; mary: any } {
  const john = {
    _id: new ObjectId('60e8bfdf84977143869267d0'),
    uuid: '00000000-a000-4000-8900-000000000000',
    name: 'John',
    address: {
      city: 'San Diego',
      state: 'CA'
    },
    reviews: [
      { uuid: '00000000-a000-4000-8900-000000000002', product: { sku: '1', title: 'Poster' }, rating: 10 },
      { uuid: '00000000-a000-4000-8900-000000000003', product: { sku: '2', title: 'Frame' }, rating: 5 }
    ],
    topReviews: ['00000000-a000-4000-8900-000000000002'],
    bestFriends: [new ObjectId('60e8bfdf84977143869267d1')],
    isActive: true,
    createdAt: new Date('2020-01-01')
  };

  const mary = {
    _id: new ObjectId('60e8bfdf84977143869267d1'),
    uuid: '00000000-a000-4000-8900-000000000001',
    name: 'Mary',
    address: {
      city: 'New York City',
      state: 'NY'
    },
    reviews: [],
    isActive: false,
    createdAt: new Date('2020-01-02')
  };

  return { john, mary };
}

export function createUsers(props?: any): { john: User; mary: User } {
  props = props || createUserProps();

  const create = (data: any): User => {
    const copy = {
      ...data,
      reviews: [...data.reviews],
      address: { ...data.address }
    };

    return Object.assign(new User(), {
      ...copy,
      reviews: (copy.reviews || {}).map((review: Partial<Review>) =>
        Object.assign(new Review(), {
          ...review,
          product: Object.assign(new Product(), review.product)
        })
      ),
      address: Object.assign(new Address(), copy.address)
    });
  };

  return {
    john: create(props.john),
    mary: create(props.mary)
  };
}
