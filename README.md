# SONINHOS

App web em JavaScript para diario e monitoramento de sonhos.

## Funcionalidades implementadas
- Diario com data atual por padrao
- Calendario navegavel com marcacao de dias com sonhos
- Gerenciador de tags para sonhos importantes
- Estatisticas (total, importantes, top tags, sonhos por mes)
- Autenticacao com email/senha + validacao de dispositivo
- Banco de dados SQLite local
- Navegacao por abas com icones
- Lembretes diarios com notificacoes (PWA basica)

## Requisitos
- Node.js 20+
- NPM 10+

## Como rodar local
1. Instale dependencias:
   npm install
2. Copie as variaveis:
   copy .env.example .env
3. Inicie em modo desenvolvimento:
   npm run dev
4. Abra:
   http://localhost:3000

## Seguranca
- A chave JWT deve ser alterada em `.env`
- O `deviceId` e validado em cada requisicao autenticada
- Para producao, recomenda-se HTTPS e cookies seguros

## Persistencia de dados em producao
Se os dados somem a cada deploy, o motivo mais comum e banco SQLite salvo em disco temporario do container.

Este projeto agora suporta caminho configuravel via `DB_PATH`.

- Local: usa `soninhos.db` na raiz do projeto
- Producao (Render): configure `DB_PATH=/var/data/soninhos.db` e monte um disco persistente em `/var/data`

No `render.yaml` ja foi adicionado volume persistente + `DB_PATH`.

Importante:
- Em alguns planos gratuitos o disco persistente pode nao estar disponivel.
- Se seu plano nao suportar disco, use um banco gerenciado (Postgres/Supabase/Neon) para nao perder login e dados.

## Preview com link publico
Como existe backend (auth + banco), o ideal e usar:
- Render ou Railway para publicar tudo
- Ou Vercel (frontend) + Render (backend)

Fluxo rapido no Render:
1. Suba este projeto para um repositorio no GitHub
2. Crie um novo Web Service no Render apontando para o repo
3. O Render vai detectar automaticamente o arquivo `render.yaml`
4. Clique em Deploy
5. Ao finalizar, copie a URL publica gerada (exemplo: https://soninhos.onrender.com)

## Link rapido sem upload (temporario)
Se voce quiser apenas testar e compartilhar rapidamente sem publicar no GitHub:
1. Rode o app localmente com `npm run dev`
2. Em outro terminal rode `npx localtunnel --port 3000`
3. O comando retorna uma URL publica temporaria

Observacoes:
- O banco SQLite em hospedagens gratuitas pode ser volatil (reiniciar e perder dados)
- Para manter dados em producao, o ideal e migrar para Postgres/Supabase
