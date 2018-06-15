import test from 'ava';

const testFunction = async value => Promise.resolve(value);

test(async (t) => {
    t.is(await testFunction(true), true);
});
