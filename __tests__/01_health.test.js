const request = require('supertest');
const app = require('../index');

beforeAll(() => {
	return app.serverStartedPromise;
});
afterAll(() => {
	app.closeServer();
});

test('Health check', async () => {
    const response = await request(app.callback()).get('/health');
    expect(response.status).toBe(200);
	expect(response.body.status).toBeDefined();
    expect(response.body.status).toBe('ok');
});

test('404', async () => {
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(404);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not Found');
});

test('404 API explorer', async () => {
	// NOTE: API explorer should not be running in the test environment
    const response = await request(app.callback()).get('/api-explorer');
    expect(response.status).toBe(404);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not Found');
});
