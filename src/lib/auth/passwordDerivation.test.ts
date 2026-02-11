import { describe, expect, it } from 'vitest';
import { deriveDeterministicPocketBasePassword, normalizeSsoEmail } from './passwordDerivation';

describe('password derivation parity', () => {
  it('normalizes SSO email consistently', () => {
    expect(normalizeSsoEmail(' User@Example.COM  ')).toBe('user@example.com');
  });

  it('matches backend deterministic password vectors', async () => {
    await expect(deriveDeterministicPocketBasePassword('yasser.mohammad@ku.ac.ae')).resolves.toBe(
      'f9e6099d2ad0ceddcd872a11a99846c4ca3c399cd20f42d70f4a474aaec1bf9fZz9A'
    );
    await expect(deriveDeterministicPocketBasePassword('tester@abc.com')).resolves.toBe(
      'd51c6cd5efde3c8d7a030172182f6ef87502a312858f25eaf473ecdbf737f5abZz9A'
    );
    await expect(deriveDeterministicPocketBasePassword(' User@Example.COM  ')).resolves.toBe(
      '7e561d62cfa4964146718c6a67d3cc8869a06e787acd7ca26e3381389a5f0d58Zz9A'
    );
  });
});
