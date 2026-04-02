# ===== 第一阶段：构建 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制代码并构建
COPY . .
RUN npm run build

# ===== 第二阶段：运行 =====
FROM nginx:alpine

# 把构建好的文件放到 Nginx 里
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
