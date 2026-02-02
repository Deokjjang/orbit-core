# Cloud Run Node runtime
FROM node:20-slim

WORKDIR /app

# install deps
COPY package.json package-lock.json ./
RUN npm ci

# copy source
COPY . .

# build (tsc refs)
RUN npx tsc -p tsconfig.cloudrun.json --pretty false
RUN node tools/fix-esm-imports.mjs dist-cloudrun

# Cloud Run listens on $PORT

EXPOSE 8080

# run server
CMD ["node","--experimental-specifier-resolution=node","dist-cloudrun/apps/dev/src/cloudRunAnytimeV02.js"]


