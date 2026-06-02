FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npx expo export -p web

FROM node:20-alpine

RUN npm install -g serve

COPY --from=build /app/dist /app/dist

EXPOSE 8081

CMD ["serve", "-s", "dist", "-l", "8081"]
