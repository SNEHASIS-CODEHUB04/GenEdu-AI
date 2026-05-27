FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install all deps including devDeps needed for build
RUN npm install --ignore-scripts

# Copy backend source
COPY backend/ .

# Build TypeScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --omit=dev

EXPOSE 4000

CMD ["node", "dist/index.js"]
