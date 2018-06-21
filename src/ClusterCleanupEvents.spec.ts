import test from 'ava';

const testFunction = async value => Promise.resolve(value);

test('passes', async (t) => {
    t.is(await testFunction(true), true);
});
