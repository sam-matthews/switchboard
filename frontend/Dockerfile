FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g serve@14.2.4
COPY --from=build /app/dist /app/dist
RUN test -f /app/dist/index.html

EXPOSE 3000

CMD ["serve", "-s", "/app/dist", "-l", "3000"]
