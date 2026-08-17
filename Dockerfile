FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
ENV PORT=8402
EXPOSE 8402
CMD ["npm", "start"]
