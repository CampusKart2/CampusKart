FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined by next build, and .env* is excluded from the
# build context by .dockerignore, so they must be passed as build args.
ARG NEXT_PUBLIC_BASE_PATH=/campuskart
ARG NEXT_PUBLIC_GETSTREAM_API_KEY
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_GETSTREAM_API_KEY=$NEXT_PUBLIC_GETSTREAM_API_KEY

RUN npm run build

EXPOSE 3000

CMD ["npm", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
