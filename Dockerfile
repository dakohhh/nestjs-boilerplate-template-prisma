# Build stage
FROM node:20.11.1-alpine AS builder

# Install necessary build dependencies (added more dependencies for native modules)
RUN apk add --no-cache git python3 make g++ build-base

WORKDIR /usr/src/app

# Copy only files needed for installation
COPY package.json yarn.lock tsconfig.json tsconfig.build.json nest-cli.json ./

# Enhanced yarn install with better error logging
RUN yarn config set network-timeout 300000 && \
    yarn install --frozen-lockfile --production=false --verbose || \
    (echo "Yarn install failed, showing yarn log:" && cat ~/.npm/_logs/*.log && exit 1)

# Copy source files
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20.11.1-alpine

# Install runtime dependencies only
RUN apk add --no-cache curl wget

WORKDIR /usr/src/app

# Copy necessary files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
COPY --from=builder /usr/src/app/tsconfig.json ./
COPY --from=builder /usr/src/app/tsconfig.build.json ./
COPY --from=builder /usr/src/app/nest-cli.json ./
COPY --from=builder /usr/src/app/src/mail/templates ./src/mail/templates

# Install only production dependencies
RUN yarn install --frozen-lockfile --production=true
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["yarn", "start:prod"]