# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

# bcrypt requires native build tools
RUN apk add --no-cache python3 make g++ && \
    npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine

WORKDIR /app

# bcrypt requires native build tools at install time
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && \
    apk del python3 make g++ && \
    rm -rf /root/.npm /tmp/*

COPY --from=build /app/dist ./dist
COPY db/ ./db/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/main.js"]
