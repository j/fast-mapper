export interface FunctionGenerator<T> {
  context: (
    property: string,
    value: any,
    suffix?: string,
    convertProperty?: boolean
  ) => string;
  generate: (code: string) => T;
  property: (name: string) => string;
}

export function createGenerator<T>(): FunctionGenerator<T> {
  // "unique" property generator
  const counters: Record<string, number> = {};
  const property = (name: string) => {
    counters[name] =
      (typeof counters[name] === 'number' ? counters[name] : -1) + 1;

    return `${name}${counters[name]}`;
  };

  const ctx = new Map();
  const context = (
    name: string,
    value: any,
    suffix?: string,
    convertProperty: boolean = true
  ) => {
    const prop = convertProperty ? property(name) : name;

    ctx.set(prop, value);

    return prop + (suffix || '');
  };

  const generate = (code: string) => {
    const compiled = new Function(...ctx.keys(), code);

    return compiled(...ctx.values());
  };

  return {
    context,
    property,
    generate
  };
}
