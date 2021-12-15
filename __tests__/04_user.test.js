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

test('login wrong pwd', async () => {
	const response = await request(app.callback()).post('/user/login').send({
		email: 'test123@example.com',
		password: '321',
	});

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('Credentials are incorrect.');
});

test('user update', async () => {
	const response = await request(app.callback()).post('/user/update')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: userId,
			first_name: 'first name changed',
		});

	expect(response.status).toBe(200);
	expect(response.body.id).toBeDefined();
	expect(response.body.id).toBe(userId);
	expect(response.body.first_name).toBeDefined();
	expect(response.body.first_name).toBe('first name changed');
	expect(response.body.is_me).toBeDefined();
	expect(response.body.is_me).toBe(true);
});

test('user update fail', async () => {
	const response = await request(app.callback()).post('/user/update')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: 0,
		});

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe("User with id 0 not found.");
});

test('user update role fail', async () => {
	const response = await request(app.callback()).post('/user/update')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: userId,
			role: 'admin',
		});

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe("Only admins have the permission to change other user's role.");
});

test('logout', async () => {
	const response = await request(app.callback()).get('/user/logout')
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(200);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('Logout successful.');
});

test('user update after logout', async () => {
	const response = await request(app.callback()).post('/user/update')
		.set({ Authorization: `Bearer ${token}` })
		.send({
			id: userId,
			first_name: 'first name changed',
		});

	expect(response.status).toBe(401);
	expect(response.body.message).toBeDefined();
    expect(response.body.message).toBe('Not authorized. Please login.');
});
