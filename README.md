# InReader API

O **inreader-api** é o backend da aplicação **InReader App**, responsável por gerenciar uploads, transcrição e análise de dados extraídos de imagens usando Inteligência Artificial. Ele fornece todas as rotas e lógica de negócios necessárias para que o frontend funcione corretamente.  

🔗 Frontend do projeto: [https://github.com/phebueno/inreader-app](https://github.com/phebueno/inreader-app)  
🔗 Site de demonstração: [https://inreader-app.vercel.app](https://inreader-app.vercel.app)  
🔗 Versão da API em deploy: [https://inreader-api.onrender.com](https://inreader-api.onrender.com)  

---

## 🛠 Tecnologias Utilizadas

- **Framework:** NestJS  
- **Banco de Dados:** PostgreSQL com Prisma ORM  
- **Armazenamento de Arquivos:** Supabase Storage (ou armazenamento local na branch `/dev/localfiles`)  
- **Extração de Texto:** Tesseract.js  
- **Interpretação de Prompts IA:** Gemini IA  
- **Containerização / Setup Local:** Docker  
- **Testes Unitários:** Jest (majoritariamente em services e controllers)  

---

## ✨ Funcionalidades

- Criação de conta e login de usuário  
- Upload de imagens e arquivos para análise  
- Extração automática de texto de imagens  
- Análise inteligente dos dados extraídos  
- Download dos resultados finais  
- API documentada com Swagger UI: [https://inreader-api.onrender.com/api](https://inreader-api.onrender.com/api)  
- Branch `/dev/localfiles` para testes com armazenamento local de arquivos  

---

## ⚙️ Como Rodar Localmente
1. Copie o arquivo .env.example para .env:
```bash
cp .env.example .env
```
> Certifique-se de configurar corretamente todas as variáveis de ambiente, incluindo credenciais do banco de dados e Supabase. Caso contrário, o Docker pode não funcionar ou os arquivos não serão salvos, impedindo o uso das features dessa aplicação. Siga o modelo do .env.example:

2. Obtenha as chaves necessárias:
- Gemini IA: obtenha sua chave gratuita em https://aistudio.google.com/
 e configure no .env.
- Supabase: crie um projeto gratuito em https://supabase.com/storage
 e copie a URL do projeto e a chave pública (service key) do seu projeto para o .env. Você pode adquirir ambas indo nas configurações do projeto e nas abas API Keys/Data API. Links diretos:
  - DATA API (URL): https://supabase.com/dashboard/project/{id_do_seu_projeto}/settings/api-keys
  - API Keys (service_role): https://supabase.com/dashboard/project/{id_do_seu_projeto}/settings/api-keys
  

```bash
POSTGRES_USER="root"

POSTGRES_PASSWORD="supersecret"

POSTGRES_DB="inreader-db"

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
JWT_SECRET="123456"

GEMINI_API_KEY="your_gemini_api"

SUPABASE_URL = "your_api_url"
SUPABASE_SERVICE_KEY = "your_service_key"
SUPABASE_BUCKET = "inreader-dev" 
```

2. Inicialize o banco de dados local usando Docker:

```bash
docker-compose up -d
```

3. Instale as dependências:

```bash
npm install
```

4. Rode as migrações do Prisma para criar as tabelas:
```bash
npx prisma migrate dev --name init
```

5. (Opcional) Gere o cliente Prisma novamente, caso necessário:
```bash
npx prisma generate
```

6. Rode o projeto em modo de desenvolvimento:
```bash
npm run start:dev

```

## 📝 Testes Unitários
Os testes foram feitos utilizando Jest, principalmente para serviços e controllers. Para rodar os testes:
```bash
npm run test
```
