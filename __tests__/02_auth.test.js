const request = require('supertest');
const app = require('../index');

beforeAll(() => {
	return app.serverStartedPromise;
});
afterAll(() => {
	app.closeServer();
});

test('401 drugs', async () => {
    const response = await request(app.callback()).get('/drugs');
    expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});

test('401 drugs id', async () => {
    const response = await request(app.callback()).get('/drugs/1');
    expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});

test('401 drugs slug', async () => {
    const response = await request(app.callback()).get('/drugs/slug/aspirin');
    expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});

test('401 tools', async () => {
    const response = await request(app.callback()).post('/tools/bmi');
    expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});

test('401 user update', async () => {
    const response = await request(app.callback()).post('/user/update');
    expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});

test('401 user delete', async () => {
    const response = await request(app.callback()).post('/user/delete');
    expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});
