FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install --only=production
RUN npm install pm2 -g
CMD ["pm2-runtime", "./index.js"]
