# nodejs-code-challenge-without-typescript-december-2021
Node.js code challenge without typescript


docker-compose -f docker-compose.db.yml up -d

npm run knex migrate:make create_users_table
npm run knex migrate:make create_sessions_table
npm run knex migrate:make create_drugs_table

npm run knex migrate:latest
npm run knex seed:make seed_drugs_table
npm run knex seed:run
