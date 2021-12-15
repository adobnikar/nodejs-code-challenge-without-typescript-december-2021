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

test('user delete fail', async () => {
	const response = await request(app.callback()).post('/user/delete')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: 0,
		});

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe("User with id 0 not found.");
});

test('user delete', async () => {
	const response = await request(app.callback()).post('/user/delete')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: userId,
		});

	expect(response.status).toBe(200);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe("Account successfully deleted.");
});

test('user delete after delete', async () => {
	const response = await request(app.callback()).post('/user/delete')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: userId,
		});

	expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});
