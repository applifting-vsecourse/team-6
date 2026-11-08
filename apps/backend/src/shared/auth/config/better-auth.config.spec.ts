import { betterAuthCoreConfig } from './better-auth.config';

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
    expect(rules?.['/forget-password']).toEqual({ window: 60, max: 5 });
    expect(rules?.['/reset-password']).toEqual({ window: 60, max: 5 });
  });

  it('filters out open-api documentation plugin in production mode', () => {
    const filterForEnv = (env: string): { id?: string }[] =>
      (betterAuthCoreConfig.plugins ?? []).filter(
        (plugin) => env !== 'production' || plugin.id !== 'open-api',
      );

    const prodPlugins = filterForEnv('production');
    expect(prodPlugins.some((p) => p.id === 'open-api')).toBe(false);

    const devPlugins = filterForEnv('development');
    expect(devPlugins.some((p) => p.id === 'open-api')).toBe(true);
  });
});
