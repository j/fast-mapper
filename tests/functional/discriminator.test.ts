import 'reflect-metadata';
import { ObjectId } from 'mongodb';
import {
  Discriminator,
  Property,
  Parent,
  map,
  PartialDeep,
  registerType
} from '../../src';
import { ObjectIdType } from '../__fixtures__/ObjectIdType';

registerType(new ObjectIdType());

@Discriminator({ property: 'type' })
abstract class Pet {
  @Parent()
  owner: any;

  @Property()
  abstract type: string;

  @Property()
  sound: string;
}

class Leash {
  @Property()
  brand: string;

  @Property()
  length: number;
}

@Discriminator({ value: 'dog' })
class Dog extends Pet {
  type: string = 'dog';

  @Property(() => Leash)
  leash: Leash;
}

class Litter {
  @Property()
  brand: string;
}

@Discriminator({ value: 'cat' })
class Cat extends Pet {
  type: string = 'cat';

  @Property(() => Litter)
  litter: Litter;
}

type Pets = Dog | Cat;

class Person {
  @Property()
  _id: ObjectId;

  @Property(() => [Pet])
  pets: Array<Dog | Cat> = [];

  @Property(() => Pet)
  favoritePet: Dog | Cat;
}

function createFixtures(): { person: Person; dog: Dog; cat: Cat; props: any } {
  const dog = new Dog();
  dog.leash = Object.assign(new Leash(), { brand: 'Petco', length: 48 });

  const cat = new Cat();
  cat.litter = Object.assign(new Litter(), { brand: 'Costco' });

  const person = new Person();
  person._id = new ObjectId();
  person.pets.push(dog);
  person.pets.push(cat);
  person.favoritePet = dog;
  person.pets.forEach((p) => (p.owner = person));

  const props: PartialDeep<Person> = {
    _id: new ObjectId(person._id),
    pets: [
      {
        type: 'dog',
        sound: 'woof',
        leash: {
          brand: 'Petco',
          length: 48
        }
      },
      {
        type: 'cat',
        sound: 'meow',
        litter: { brand: 'Costco' }
      }
    ],
    favoritePet: {
      type: 'dog',
      sound: 'woof',
      leash: {
        brand: 'Petco',
        length: 48
      }
    }
  };

  return { person, dog, cat, props };
}

describe('@Discriminator()', () => {
  test('creates model from props', () => {
    const { props } = createFixtures();

    const result: Person = map(Person).create(props);

    expect(result).toBeInstanceOf(Person);
    expect(result._id.toHexString()).toEqual(props._id.toHexString());
    expect(result.pets).toHaveLength(2);
    expect(result.pets[0]).toBeInstanceOf(Dog);
    expect(result.pets[0].type).toBe('dog');
    expect(result.pets[0].sound).toBe('woof');
    expect(result.pets[1]).toBeInstanceOf(Cat);
    expect(result.pets[1].type).toBe('cat');
    expect(result.pets[1].sound).toBe('meow');
    expect((result.pets[1] as Cat).litter).toBeInstanceOf(Litter);
    expect((result.pets[1] as Cat).litter?.brand).toBe('Costco');
    expect(result.favoritePet).toBeInstanceOf(Dog);
    expect(result.favoritePet.owner).toBe(result);
  });

  test('creates model from plain', () => {
    const { props } = createFixtures();

    const result: Person = map(Person).fromPlain(props);

    expect(result).toBeInstanceOf(Person);
    expect(result._id.toHexString()).toEqual(props._id.toHexString());
    expect(result.pets).toHaveLength(2);
    expect(result.pets[0]).toBeInstanceOf(Dog);
    expect(result.pets[0].type).toBe('dog');
    expect(result.pets[0].sound).toBe('woof');
    expect(result.pets[1]).toBeInstanceOf(Cat);
    expect(result.pets[1].type).toBe('cat');
    expect(result.pets[1].sound).toBe('meow');
    expect((result.pets[1] as Cat).litter).toBeInstanceOf(Litter);
    expect((result.pets[1] as Cat).litter?.brand).toBe('Costco');
    expect(result.favoritePet).toBeInstanceOf(Dog);
    expect(result.favoritePet.owner).toBe(result);
  });

  test('creates plain from model', () => {
    const { props } = createFixtures();

    const person: Person = map(Person).fromPlain(props);
    const result: Person = map(Person).toPlain(person);

    expect(result instanceof Person).toBeFalsy();
    expect(result._id.toHexString()).toEqual(props._id.toHexString());
    expect(result.pets).toHaveLength(2);
    expect(result.pets[0] instanceof Dog).toBeFalsy();
    expect(result.pets[0].type).toBe('dog');
    expect(result.pets[0].sound).toBe('woof');
    expect(result.pets[1] instanceof Cat).toBeFalsy();
    expect(result.pets[1].type).toBe('cat');
    expect(result.pets[1].sound).toBe('meow');
    expect((result.pets[1] as Cat).litter instanceof Litter).toBeFalsy();
    expect((result.pets[1] as Cat).litter?.brand).toBe('Costco');
    expect(result.favoritePet instanceof Dog).toBeFalsy();
    expect(result.favoritePet.owner).toBeUndefined();
  });

  test('creates props object from model', () => {
    const { props } = createFixtures();

    const person: Person = map(Person).fromPlain(props);
    const result: Person = map(Person).toProps(person);

    expect(result instanceof Person).toBeFalsy();
    expect(result._id.toHexString()).toEqual(props._id.toHexString());
    expect(result.pets).toHaveLength(2);
    expect(result.pets[0] instanceof Dog).toBeFalsy();
    expect(result.pets[0].type).toBe('dog');
    expect(result.pets[0].sound).toBe('woof');
    expect(result.pets[1] instanceof Cat).toBeFalsy();
    expect(result.pets[1].type).toBe('cat');
    expect(result.pets[1].sound).toBe('meow');
    expect((result.pets[1] as Cat).litter instanceof Litter).toBeFalsy();
    expect((result.pets[1] as Cat).litter?.brand).toBe('Costco');
    expect(result.favoritePet instanceof Dog).toBeFalsy();
    expect(result.favoritePet.owner).toBeUndefined();
  });
});
