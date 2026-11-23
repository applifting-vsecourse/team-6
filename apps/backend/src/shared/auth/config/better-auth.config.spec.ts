import {
  betterAuthCoreConfig,
  resolveBetterAuthPlugins,
  resolveRateLimitEnabled,
} from './better-auth.config';

describe('betterAuthCoreConfig', () => {
  it('enables rate limiting with generous global default and strict custom rules on auth endpoints', () => {
    expect(betterAuthCoreConfig.rateLimit).toBeDefined();
    expect(betterAuthCoreConfig.rateLimit?.enabled).toBe(true);
    expect(betterAuthCoreConfig.rateLimit?.max).toBe(100);
    expect(betterAuthCoreConfig.rateLimit?.window).toBe(60);

    const rules = betterAuthCoreConfig.rateLimit?.customRules;
    expect(rules).toBeDefined();
    expect(rules?.['/sign-in/email']).toEqual({ window: 60, max: 10 });
    expect(rules?.['/sign-up/email']).toEqual({ window: 60, max: 5 });
  });

  describe('resolveBetterAuthPlugins', () => {
    it('omits open-api documentation plugin in production mode', () => {
      const prodPlugins = resolveBetterAuthPlugins('production');
      expect(prodPlugins.some((p) => p.id === 'open-api')).toBe(false);
      expect(prodPlugins.some((p) => p.id === 'username')).toBe(true);
    });

    it('includes open-api documentation plugin in non-production mode', () => {
      const devPlugins = resolveBetterAuthPlugins('development');
      expect(devPlugins.some((p) => p.id === 'open-api')).toBe(true);
      expect(devPlugins.some((p) => p.id === 'username')).toBe(true);
    });
  });

  describe('resolveRateLimitEnabled', () => {
    it('turns the limit off when DISABLE_RATE_LIMIT is set in development', () => {
      expect(resolveRateLimitEnabled('development', true)).toBe(false);
    });

    it('turns the limit off when DISABLE_RATE_LIMIT is set in test', () => {
      expect(resolveRateLimitEnabled('test', true)).toBe(false);
    });

    it('keeps the limit in production even with DISABLE_RATE_LIMIT set', () => {
      expect(resolveRateLimitEnabled('production', true)).toBe(true);
    });

    it('keeps the limit in any other environment with DISABLE_RATE_LIMIT set, e.g. staging', () => {
      expect(resolveRateLimitEnabled('staging', true)).toBe(true);
      expect(resolveRateLimitEnabled('preview', true)).toBe(true);
    });

    it('keeps the limit when NODE_ENV is not set', () => {
      expect(resolveRateLimitEnabled(undefined, true)).toBe(true);
    });

    it('keeps the limit when DISABLE_RATE_LIMIT is not set', () => {
      expect(resolveRateLimitEnabled('development', false)).toBe(true);
    });

    it('never turns on a limit the core config switched off', () => {
      expect(resolveRateLimitEnabled('production', false, false)).toBe(false);
    });
  });
});
