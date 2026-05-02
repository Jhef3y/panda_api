# 🐼 Panda Transfer API

API REST para bridge com a rede Solana. Permite autenticação de usuários, gerenciamento de carteiras Solana e interação com smart contracts (programs) na rede.

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) (para o banco de dados PostgreSQL)
- [npm](https://www.npmjs.com/)

---

## 🚀 Rodando o projeto localmente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd panda_api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL rodando no Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/panda-db?schema=public"

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=7d

# Encryption (AES-256) - Deve ter exatamente 32 caracteres
ENCRYPTION_KEY=sua_chave_de_32_caracteres_aqui!

# Solana
SOLANA_NETWORK=devnet
# Opções: devnet | testnet | mainnet-beta
```

### 4. Suba o banco de dados com Docker

```bash
docker run --name panda-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=panda-db \
  -p 5432:5432 \
  -d postgres:15
```

### 5. Gere o Prisma Client

```bash
npx prisma generate
```

### 6. Execute as migrations

```bash
npx prisma migrate dev --name init
```

### 7. Inicie o servidor em desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

### Health Check

```bash
curl http://localhost:3000/health
```

---

## 🗄️ Migrations

### Criar uma nova migration após alterar o schema

```bash
npx prisma migrate dev --name nome_da_migration
```

### Aplicar migrations em produção

```bash
npx prisma migrate deploy
```

### Visualizar o banco de dados (GUI)

```bash
npx prisma studio
```

---

## 🏗️ Build

Para compilar o projeto TypeScript para JavaScript:

```bash
npm run build
```

Os arquivos compilados ficarão na pasta `dist/`.

---

## 🚢 Deploy

### Variáveis de ambiente em produção

Configure as seguintes variáveis no seu ambiente de produção (servidor, plataforma de cloud, etc.):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão com o PostgreSQL |
| `JWT_SECRET` | Chave secreta para assinatura dos tokens JWT |
| `JWT_EXPIRES_IN` | Tempo de expiração do JWT (ex: `7d`) |
| `ENCRYPTION_KEY` | Chave AES-256 de exatamente 32 caracteres |
| `SOLANA_NETWORK` | Rede Solana: `devnet`, `testnet` ou `mainnet-beta` |
| `PORT` | Porta do servidor (padrão: `3000`) |
| `NODE_ENV` | `production` |

### Deploy manual em VPS (Ubuntu/Debian)

```bash
# 1. Instale as dependências
npm install --omit=dev

# 2. Gere o Prisma Client
npx prisma generate

# 3. Execute as migrations
npx prisma migrate deploy

# 4. Compile o projeto
npm run build

# 5. Inicie o servidor
npm start
```

### Deploy com PM2

```bash
# Instale o PM2 globalmente
npm install -g pm2

# Build e geração do cliente
npm run build
npx prisma generate
npx prisma migrate deploy

# Inicie com PM2
pm2 start dist/server.js --name panda-api

# Salve a configuração para reinício automático
pm2 save
pm2 startup
```

### Deploy com Docker

Crie um `Dockerfile` na raiz do projeto:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

Build e execução:

```bash
docker build -t panda-api .

docker run -d \
  --name panda-api \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/panda-db" \
  -e JWT_SECRET="seu_secret" \
  -e ENCRYPTION_KEY="sua_chave_32_chars_aqui!!!!!!!!" \
  -e SOLANA_NETWORK="mainnet-beta" \
  -e NODE_ENV="production" \
  panda-api
```

### Deploy na Railway / Render / Fly.io

1. Conecte o repositório à plataforma
2. Configure as variáveis de ambiente no painel
3. Defina o comando de build:
   ```
   npm install && npx prisma generate && npm run build
   ```
4. Defina o comando de start:
   ```
   npx prisma migrate deploy && npm start
   ```

---

## 📡 Endpoints

### Auth
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Registra um novo usuário |
| `POST` | `/auth/login` | Autentica e retorna JWT |

### Wallet
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/wallet/balance` | Retorna saldo em SOL |
| `GET` | `/wallet/tokens` | Lista tokens SPL |
| `POST` | `/wallet/transfer` | Transfere SOL |

### Contract
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/contract/initiate` | Inicia interação com smart contract |
| `POST` | `/contract/execute` | Executa instrução em contrato já iniciado |

### Health
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica status da API |

---

## 🛠️ Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento com hot reload |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia o servidor compilado |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Executa migrations em desenvolvimento |
| `npm run prisma:studio` | Abre o Prisma Studio (GUI do banco) |

