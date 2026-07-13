import { matchesDemoCredential } from './auth.service';

describe('matchesDemoCredential', () => {
  it('accepts the built-in demo credentials', () => {
    expect(matchesDemoCredential('demo@tovrika.com', 'demo1234')).toBeTrue();
  });

  it('rejects incorrect passwords', () => {
    expect(matchesDemoCredential('demo@tovrika.com', 'wrong-password')).toBeFalse();
  });
});
