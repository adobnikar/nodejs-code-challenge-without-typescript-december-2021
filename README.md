# Node.js code challenge (without typescript)

## Run with docker

Requirements

- Docker 19.03.0+ (https://docs.docker.com/engine/install/)
- Docker Compose 1.27.0+ (https://docs.docker.com/compose/install/)

Start commands
```bash
cp .env.example .env
# Change the POSTGRES_PASSWORD in the .env file
docker-compose up -d
```

All the ports listed in the `.env` file are internal to the docker containers.
If you want to change the external ports, please modify the `docker-compose.yml` file accordingly.

Stop command
```bash
docker-compose down
```

Enter the container command shell
```bash
docker exec -it <container name or id> /bin/sh
```

List the node processes running in the container (command needs to be run inside the container)
```bash
pm2 list
```



## Development

System used for development

- OS: Ubuntu 20.04
- Node.js: v16.13.1 (https://nodejs.org/en/)
- Visual Studio Code (https://code.visualstudio.com/)

Setup
```bash
cp .env.example .env
# Change the POSTGRES_PASSWORD in the .env file
# Change the POSTGRES_HOST in the .env file to 127.0.0.1
# Change the POSTGRES_PORT in the .env file to 25432
```

Start only the database container
```bash
docker-compose -f docker-compose.db.yml up -d
```

The `POSTGRES_PORT` port in the `.env` file is internal to the docker container.
If you want to change the external database port, please modify the `docker-compose.db.yml` file accordingly.

Start the application with one of the following commands
```bash
npm start
node index.js
nodemon index.js
```

or debug the application with the help of the VS Code launch system (https://code.visualstudio.com/docs/editor/debugging).
The launch commands are specified in the `.vscode/launch.json` file.

## Testing

Setup is the same as for the development.
Only instead of launching the application, run the tests.
Jest (https://jestjs.io/) and SuperTest (https://www.npmjs.com/package/supertest) frameworks are used for testing.
Run the tests with the following command:

```bash
npm test
```

## API documentation

Once you start the server you can find the API documentation at `http://127.0.0.1:[SERVER_PORT]/api-explorer`.
Documentation is auto-generated from the JSDoc (https://jsdoc.app/) comments above the functions in the controllers.

**NOTE**: To log in just run the POST `/user/login` API endpoint from the API explorer. Cookies will handle the rest!!!

## Database migrations

[Knex.js](https://knexjs.org/) library is used for the database migrations.
You can also install knex globally with the `npm install knex -g` command (but this is not required).
Here are some basic Knex.js CLI commands:

```bash
npm run knex migrate:make [migration_name] # Create a new migration file.
npm run knex migrate:latest # Migrate the database to the latest version.
npm run knex migrate:rollback # Rollback the last batch of migrations.
```

## Database seeds

[Knex.js](https://knexjs.org/) library is used for the database seeds.
You can also install knex globally with the `npm install knex -g` command (but this is not required).
Here are some basic Knex.js CLI commands:

```bash
npm run knex seed:make [migration_name] # Create a new seed file.
npm run knex seed:run # Run the seeds.
```

## Used HTTP response status codes

- 200 - OK,
- 400 - Bad Request (The error message of this response should be displayed to the user),
- 401 - Unauthorized (User is not logged in and should be redirected to the login page),
- 403 - Forbidden (User does not have the permission to perform this action - the error message of this response or a hardcoded message should be displayed to the user),
- 404 - Not Found,
- 413 - Payload Too Large (uploaded file is too large),
- 500 - Internal server error.

## Authentication procedure

You can log in by calling the POST `/user/login` API endpoint.
In response the authentication token is returned twice:

- once in the HTTP response header "x-set-auth-token",
- and as a cookie named "token" (only for API documentation purposes).

For front-end development please *use the header* as the cookie should be removed in production (to prevent [CSRF](https://www.imperva.com/learn/application-security/csrf-cross-site-request-forgery/) attacks).
The cookie should only be used in the development environment to make the API explorer work.

You can store the token in the local storage.
Send it with every request to the API in the "authorization" request header in the next format:

```
authorization: Bearer [token]
```

Because the token will be refreshing every few minutes it is necessary to intercept every response from the API and check for the "x-set-auth-token" header.
If you see the "x-set-auth-token" header in the response you will need to replace the existing token in the storage with the new one.
