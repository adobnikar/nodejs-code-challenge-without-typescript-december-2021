const request = require('supertest');
const app = require('../index');
let token = null;
let userId = null;

beforeAll(() => {
	return app.serverStartedPromise;
});
afterAll(() => {
	app.closeServer();
});

test('register', async () => {
	const response = await request(app.callback()).post('/user/register').send({
		email: 'test123@example.com',
		password: '123',
		repeatPassword: '123',
		first_name: 'Test',
		last_name: 'Test',
	});

	if (response.status === 400) {
		expect(response.body.message).toBeDefined();
		expect(response.body.message).toBe('An account with this email already exists.');
	} else {
		expect(response.status).toBe(200);
		expect(response.body.id).toBeDefined();
		expect(response.body.email).toBeDefined();
		expect(response.body.email).toBe('test123@example.com');
		expect(response.body.role).toBeDefined();
		expect(response.body.role).toBe('user');
	}
});

test('login', async () => {
	const response = await request(app.callback()).post('/user/login').send({
		email: 'test123@example.com',
		password: '123',
	});

	expect(response.status).toBe(200);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('Login successful.');
	expect(response.body.token).toBeDefined();
	expect(response.body.user).toBeDefined();
	expect(response.body.user.id).toBeDefined();
	token = response.body.token;
	userId = response.body.user.id;
});

test('tools wrong tool id', async () => {
	const response = await request(app.callback()).post('/tools/asd')
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('Only valid tool id is "BMI".');
});

test('tool height missing', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('"height" is required');
});

test('tool weight missing', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.send({ height: 1 })
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('"weight" is required');
});

test('tool weight max exceeded', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.send({ height: 1, weight: 1000 })
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('"weight" must be less than or equal to 500');
});

test('tool weight min exceeded', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.send({ height: 1, weight: 0.5 })
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('"weight" must be larger than or equal to 1');
});

test('tool height max exceeded', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.send({ height: 1000, weight: 1 })
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('"height" must be less than or equal to 500');
});

test('tool height min exceeded', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.send({ height: 0.5, weight: 1 })
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('"height" must be larger than or equal to 1');
});

test('tool bmi', async () => {
	const response = await request(app.callback()).post('/tools/bmi')
		.send({ height: 200, weight: 100 })
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(200);
	expect(response.body.height).toBeDefined();
	expect(response.body.height).toBe(200);
	expect(response.body.weight).toBeDefined();
	expect(response.body.weight).toBe(100);
	expect(response.body.bmi).toBeDefined();
	expect(response.body.bmi).toBe(25);
});
