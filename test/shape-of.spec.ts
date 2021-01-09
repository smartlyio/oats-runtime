import * as runtime from '../src/runtime';

const tag = Symbol();
type Value = runtime.BrandedScalar<string, typeof tag>;
const tag2 = Symbol();
type Value2 = runtime.BrandedScalar<string, typeof tag2>;

const tagNum = Symbol();
type ValueNum = runtime.BrandedScalar<number, typeof tagNum>;
const tagBool = Symbol();
type ValueBool = runtime.BrandedScalar<boolean, typeof tagBool>;

function assignableTo<T>(_t: T) {
  return;
}

enum EnumTag {}
class BrandedClass extends runtime.valueClass.ValueClass<never, EnumTag> {
  a = 'a';
}

enum EnumTag2 {}
class BrandedClass2 extends runtime.valueClass.ValueClass<never, EnumTag2> {
  a = 'a';
}

describe('ShapeOf', () => {
  it('works with branded types', () => {
    assignableTo<runtime.ShapeOf<Value>>('a');
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<Value>>(1);

    assignableTo<runtime.ShapeOf<ValueNum>>(1);
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<ValueNum>>('a');

    assignableTo<runtime.ShapeOf<ValueBool>>(true);
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<ValueBool>>(1);
  });

  it('Shapes Arrays', () => {
    assignableTo<runtime.ShapeOf<Value[]>>(['a']);
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<Value[]>>([1]);
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<Value[]>>({});
  });

  it('Shapes Objects', () => {
    assignableTo<runtime.ShapeOf<{ a: Value }>>({ a: 'a' });
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<{ a: Value }>>({ a: 1 }); // prevent nested type mismatch
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<{ a: Value }>>({ b: 'a' }); // prevent unknown fields

    assignableTo<runtime.ShapeOf<BrandedClass>>({ a: 'a' });
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<BrandedClass>>({ b: 'a' });

    assignableTo<runtime.ShapeOf<BrandedClass>>({ a: 'a' } as BrandedClass2);
    assignableTo<runtime.ShapeOf<BrandedClass2>>({ a: 'a' } as BrandedClass);
  });

  it('keeps type literal', () => {
    assignableTo<runtime.ShapeOf<'abc'>>('abc');
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<'abc'>>('zzz');
  });

  it('follows unions', () => {
    assignableTo<runtime.ShapeOf<string | number>>(1);
    assignableTo<runtime.ShapeOf<string | number>>('a');
    // @ts-expect-error
    assignableTo<runtime.ShapeOf<string | number>>(true);
  });
});

describe('Branding', () => {
  it('separates classes', () => {
    const a: BrandedClass = {} as any;
    // @ts-expect-error
    assignableTo<BrandedClass2>(a); // prevents cross assign
    assignableTo<BrandedClass>(a); // allaws assign with correct branding

    const { ...r } = a;
    // @ts-expect-error
    assignableTo<BrandedClass>(r); // destructuring loses branding
  });
  it('separates types', () => {
    // @ts-expect-error
    assignableTo<Value>('a'); // prevent unbranded assign
    assignableTo<Value>('a' as Value); // allow assign with branded value
    // @ts-expect-error
    assignableTo<Value>('a' as Value2); // prevent cross assign
    assignableTo<Value2>('a' as Value2);

    // @ts-expect-error
    assignableTo<Value>(1); // prevent assign with wrong scalar type
    // @ts-expect-error
    assignableTo<Value>(1 as Value); // prevent 'as' with incompatible type

    // @ts-expect-error
    const { ...r } = 'a' as Value; // cannot destructure branded scalars
    r === r;
  });
});
