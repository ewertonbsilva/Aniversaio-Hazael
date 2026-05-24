# Aniversário do Hazael

Convite interativo para o primeiro aniversário do Hazael, com visual temático, confirmação de presença, mural de fotos e painel administrativo autenticado com Supabase.

## O que o app faz

- Exibe o convite com data, hora, local e atalhos para mapa.
- Permite confirmar presença pelo formulário RSVP.
- Mostra tamanhos sugeridos e chave PIX para presentes.
- Renderiza um mural de fotos do Hazael.
- Possui painel dos pais para:
  - editar dados da festa
  - atualizar foto principal
  - gerenciar PIX e tamanhos
  - adicionar, editar e remover fotos do mural
  - exportar confirmações

## Stack

- `React 19`
- `Vite`
- `Express`
- `Supabase`
- `Tailwind CSS`
- `Google Gemini` para sugestão de legenda de fotos

## Ambiente

Crie um arquivo `.env.local` com:

```env
GEMINI_API_KEY="sua_chave_gemini"
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"
SUPABASE_SERVICE_ROLE_KEY="seu_service_role_key_opcional"
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"
```

Notas:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são usados no login do painel via browser.
- No deploy da Vercel, o backend também aceita fallback dessas variáveis `VITE_*` caso `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` não tenham sido configuradas separadamente.
- `SUPABASE_SERVICE_ROLE_KEY` é opcional, mas recomendado para operações administrativas no backend.
- Sem `GEMINI_API_KEY`, o recurso de legenda automática por IA não funciona.

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Deploy na Vercel

O projeto agora inclui:

- [vercel.json](/C:/APPs/Aniversario%20Hazael/vercel.json) para rewrite do SPA
- [api/index.ts](/C:/APPs/Aniversario%20Hazael/api/index.ts) como entrypoint serverless das rotas `/api/*`

Se o frontend subir sem a API, a Vercel vai retornar `404` em rotas como `/api/config` e `/api/rsvps`. Essa configuração existe justamente para evitar esse problema.

## Painel administrativo

O acesso ao painel é autenticado com `Supabase Auth` por e-mail e senha.

Atualmente os acessos configurados são:

- `ewerton.bezerra@hotmail.com`
- `oliveiraaraiane565@gmail.com`

## Estrutura principal

- [src/App.tsx](/C:/APPs/Aniversario%20Hazael/src/App.tsx): experiência pública do convite
- [src/components/AdminPanel.tsx](/C:/APPs/Aniversario%20Hazael/src/components/AdminPanel.tsx): painel administrativo
- [src/components/Gallery.tsx](/C:/APPs/Aniversario%20Hazael/src/components/Gallery.tsx): mural de fotos
- [server.ts](/C:/APPs/Aniversario%20Hazael/server.ts): API Express e integração com Supabase
- [src/lib/supabase.ts](/C:/APPs/Aniversario%20Hazael/src/lib/supabase.ts): cliente Supabase do frontend

## Supabase esperado

O app depende destas tabelas no schema `public`:

- `party_config`
- `party_photos`
- `party_rsvps`

Também usa:

- `Supabase Auth` para login no painel
- `Supabase Storage` para armazenar as imagens do mural
