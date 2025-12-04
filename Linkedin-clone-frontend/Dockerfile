FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for environment variables
ARG VITE_SERVER_URL=/api
# ARG VITE_SOCKET_URL=/socket.io

# Set environment variables during build
ENV VITE_SERVER_URL=$VITE_SERVER_URL
# ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build




FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]