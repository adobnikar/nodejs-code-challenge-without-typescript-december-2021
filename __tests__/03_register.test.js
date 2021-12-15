const request = require('supertest');
const app = require('../index');

beforeAll(() => {
	return app.serverStartedPromise;
});
afterAll(() => {
	app.closeServer();
});

test('register missing password', async () => {
    const response = await request(app.callback()).post('/user/register').send({
		email: 'test123@example.com',
	});
    expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('\"password\" is required');
});

test('register missing repeated password', async () => {
    const response = await request(app.callback()).post('/user/register').send({
		email: 'test123@example.com',
		password: '123',
	});
    expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('\"repeatPassword\" is required');
});

test('register repeated password does not match', async () => {
    const response = await request(app.callback()).post('/user/register').send({
		email: 'test123@example.com',
		password: '123',
		repeatPassword: '321',
	});
    expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Repeated password does not match.');
});
