const request = require('supertest');
const app = require('../index');
let token = null;
let userId = null;
let drugId = null;
let drugSlug = null;

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

test('drugs list', async () => {
	const response = await request(app.callback()).get('/drugs')
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(200);
	expect(Array.isArray(response.body)).toBe(true);
	for (const drug of response.body) {
		drugId = drug.id;
		drugSlug = drug.slug;
		expect(drug.id).toBeDefined();
		expect(drug.slug).toBeDefined();
		expect(drug.name).toBeDefined();
		expect(drug.description).toBeDefined();

		expect(drug.confirmed).toBeDefined();
		expect(drug.published).toBeDefined();
		expect(drug.confirmed).toBe(true);
		expect(drug.published).toBe(true);
	}
});

test('drugs get', async () => {
	const response = await request(app.callback()).get('/drugs/' + drugId)
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(200);
	expect(response.body.id).toBeDefined();
	expect(response.body.id).toBe(drugId);
	expect(response.body.slug).toBeDefined();
	expect(response.body.name).toBeDefined();
	expect(response.body.description).toBeDefined();
	expect(response.body.confirmed).toBeDefined();
	expect(response.body.published).toBeDefined();
	expect(response.body.confirmed).toBe(true);
	expect(response.body.published).toBe(true);
});

test('drugs get by slug', async () => {
	const response = await request(app.callback()).get('/drugs/slug/' + drugSlug)
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(200);
	expect(response.body.id).toBeDefined();
	expect(response.body.slug).toBeDefined();
	expect(response.body.slug).toBe(drugSlug);
	expect(response.body.name).toBeDefined();
	expect(response.body.description).toBeDefined();
	expect(response.body.confirmed).toBeDefined();
	expect(response.body.published).toBeDefined();
	expect(response.body.confirmed).toBe(true);
	expect(response.body.published).toBe(true);
});

test('drugs get fail', async () => {
	const response = await request(app.callback()).get('/drugs/0')
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('Drug with id 0 not found.');
});

test('drugs get by slug fail', async () => {
	const response = await request(app.callback()).get('/drugs/slug/ajsfajkghfkdasjdshgfkjdshfk')
		.set({ Authorization: `Bearer ${token}` });

	expect(response.status).toBe(400);
	expect(response.body.message).toBeDefined();
	expect(response.body.message).toBe('Drug with slug "ajsfajkghfkdasjdshgfkjdshfk" not found.');
});
