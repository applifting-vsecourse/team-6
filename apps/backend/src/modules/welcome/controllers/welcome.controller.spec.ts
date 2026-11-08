import { Config } from '@/shared/config/config.service';
import { WelcomeController } from './welcome.controller';

describe('WelcomeController', () => {
  const createController = (
    nodeEnv: 'development' | 'production',
  ): WelcomeController => {
    const config = {
      name: 'Kvintet',
      description: 'Find your micro-community',
      version: '0.1.0',
      nodeEnv,
    } as unknown as Config;
    return new WelcomeController(config);
  };

  it('includes Swagger and BetterAuth reference docs in non-production environments', async () => {
    const controller = createController('development');
    const response = await controller.getWelcomeMessage();

    expect(response.swaggerDocs).toBe('/api/docs');
    expect(response.authEndpointsDocs).toBe('/api/auth/reference');
    expect(response.healthCheck).toBe('/api/health');
    expect(response.version).toBe('0.1.0');
  });

  it('omits Swagger and BetterAuth documentation paths in production environment', async () => {
    const controller = createController('production');
    const response = await controller.getWelcomeMessage();

    expect(response.swaggerDocs).toBeUndefined();
    expect(response.authEndpointsDocs).toBeUndefined();
    expect(response.healthCheck).toBe('/api/health');
    expect(response.name).toBe('Kvintet');
  });

  it('answers health check with ok status', async () => {
    const controller = createController('production');
    const health = await controller.getHealth();

    expect(health).toEqual({ status: 'ok' });
  });
});
