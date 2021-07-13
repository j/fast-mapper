<h1 align="center" style="border-bottom: none;">🔗 fast-mapper</h1>
<h3 align="center">A simple JIT & <a href="https://www.typescriptlang.org/docs/handbook/decorators.html">@decorator</a> based object mapper</h3>

**fast-mapper** makes it easy to map classes to plain objects and back using `@decorators`.

Why? Because solutions like <a href="https://github.com/typestack/class-transformer">class-transformer</a> are verrrryyy slow when hydrating a lot of documents, and we want 
to do better... so use this instead!

## Features

- Extremely simply `@Decorator()` based document mapping
- Very fast 🚀! (thanks to JIT compilation)
- Discriminator mapping
- & more!

## Planned Features

- [ ] Validation
- [ ] Create more common types
- [ ] Figure out what else should be added


## How to use

```typescript
import { Property, map } from 'fast-mapper';
import { ObjectId } from 'mongodb';

abstract class Base {
  @Property({ type: ObjectIdType })
  _id: ObjectId;

  get id(): string {
    return this._id.toHexString();
  }

  @Property()
  createdAt: Date = new Date();

  @Property()
  updatedAt: Date = new Date();
}
```

Now create our document class with some fields.

```typescript
import { Property } from 'fast-mapper';
import { BaseDocument, Address, Pet } from './models';

class User extends Base {
  @Property()
  name: string;

  @Property(() => Address)
  address: Address; // single embedded document

  @Property(() => [Address])
  addresses: Address[] = []; // array of embedded documents

  @Property(() => [Pet])
  pets: Pet[] = []; // array of discriminator mapped documents

  @Property(() => Pet)
  favoritePet: Pet; // single discriminator mapped document
  
  @Property({ type: 'date' }) // "type" needs to be specified here due to reflection not seeing the Date[] since it's an array.
  dates: Date[];
}
```

and here's the nested `Address` document.

```typescript
import { Property } from 'fast-mapper';

class Address {
  @Property()
  city: string;

  @Property()
  state: string;
}
```

Now let's do some mapping...

```typescript
import { map } from 'fast-mapper';
import { User } from './models';

const user = new User();
user.name = 'John Doe';
// ... populate the rest


/**
 * Plain mapping (converts to destination mapping, including names)
 */

// converting to the mapped value as a plain object
const plain = map(User).toPlain(user);

// .. and convert back
const user = map(User).fromPlain(plain);


/**
 * JSON mapping (keeps original property names)
 */

// convert to a JSON compatible type (useful for micro-service communication as an example)
const json = map(User).toJSON(user);

// .. and convert back
const user = map(User).fromJSON(json);


/**
 * Instance Property Mapping (keeps original property names)
 */

// Alternatively, you can create a user via mapping:
const user = map(User).fromProps({ name: 'John Doe', /* ... */ });

// and if you want to convert a user to it's props (unmapped field names)
const props = map(User).toProps(user);

```

## Property Types

Types can be automatically discovered using reflection (`reflect-metadata`) and the `Type.prototype.isType` property,
however, if your property is an array, you must specify the type manually using `@Property({ type: 'date' }) dates: Date[]` 
otherwise the values will not be mapped.

You can also create a custom type that extends `Type` (See `types/DateType` as an example).

To register your custom type, see the example below (these are also in `tests/__fixtures__`).

```typescript
registerType(new ObjectIdType());
registerType(new UUIDType());
```

## Discriminator Mapping

`fast-mapper` also has support for discriminator mapping (polymorphism). You do this
by creating a base class mapped by `@Discriminator({ property: '...' })` with a `@Property()` with the
name of the "property". Then decorate discriminator types with `@Discriminator({ value: '...' })`
and `fast-mapper` takes care of the rest.

```typescript
import { Discriminator, Property } from 'fast-mapper';

@Discriminator({ property: 'type' })
abstract class Pet {
  @Property()
  abstract type: string;

  @Property()
  abstract sound: string;

  speak(): string {
    return this.sound;
  }
}

@Discriminator({ value: 'dog' })
class Dog extends Pet {
  type: string = 'dog';
  sound: string = 'ruff';

  // dog specific fields & methods
}

@Discriminator({ value: 'cat' })
class Cat extends Pet {
  type: string = 'cat';
  sound: string = 'meow';

  // cat specific fields & methods
}
```

And now, lets see the magic!

```typescript
import { map } from 'fast-mapper';
import { User } from './models';

async () => {
  const user = map(User).create({
    name: 'John Doe',
    address: {
      city: 'San Diego',
      state: 'CA'
    },
    addresses: [
      {
        city: 'San Diego',
        state: 'CA'
      }
    ],
    pets: [{ type: 'dog', sound: 'ruff' }],
    favoritePet: { type: 'dog', sound: 'ruff' }
  });
  
  console.log(user instanceof User); // true

  const mapped = map(User).toPlain(user);

  console.log(user instanceof User); // false
};
```

## Want to use this in a library / ORM?

We wanted to make sure to keep library and user-land mapping separated, so consuming libraries can have
their own mapping and type registration separate from a user's.

All you have to do to add mapping to your library is:

```typescript
import { Mapper } from 'fast-mapper';

const mapper = new Mapper();

function Field(/* your options */): PropertyDecorator {
  return (target: any, propertyName: string) => {
    mapper.decorators.Property(/* map your options to Property options */)(target, propertyName);
  }
}
```

## Examples

For more advanced usage and examples, check out the tests.
