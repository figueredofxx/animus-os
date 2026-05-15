# ANIMUS OS — Athlete Dashboard

App mobile-first para controle de ciclos, peso, treinos e dieta com IA.

---

## 🚀 Deploy no Netlify (3 passos)

### Passo 1 — Suba no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório (ex: `animus-os`)
3. Faça upload de todos os arquivos desta pasta

### Passo 2 — Conecte no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Escolha **GitHub** → selecione o repositório `animus-os`
4. As configurações de build já estão no `netlify.toml`, clique **Deploy site**

### Passo 3 — Configure a chave do Gemini (IA de alimentos)

1. Pegue sua chave **gratuita** em: https://aistudio.google.com/app/apikey
2. No Netlify → **Site configuration** → **Environment variables**
3. Clique **Add a variable**:
   - Key: `GEMINI_API_KEY`
   - Value: sua chave
4. Vá em **Deploys** → **Trigger deploy** → **Deploy site**

✅ Pronto! Seu app estará em `https://SEU-NOME.netlify.app`

---

## 📱 Instalar no celular como app (PWA)

### Android (Chrome)
1. Abra a URL no Chrome
2. Menu (⋮) → **Adicionar à tela inicial**
3. Toque **Adicionar**

### iPhone (Safari)
1. Abra no Safari
2. Botão **Compartilhar** → **Adicionar à Tela de Início**
3. Toque **Adicionar**

---

## 🧠 Funcionalidades

**💉 Ciclos**
- 12 compostos pré-cadastrados (Testo E/C/P, Deca, Tren A/E, Winstrol, Anavar, EQ, Masteron, Clomid, Tamox)
- Gráfico de meia-vida real — curva exponencial de decaimento por aplicação
- Registrar aplicações com dose, músculo e data
- Progresso por semanas com barra visual

**⚖️ Peso**
- Gráfico histórico com linha de meta
- Gauge de progresso da meta
- Delta por pesagem

**🏋️ Treinos**
- Registrar treinos com exercícios, séries, reps e carga
- Heatmap de frequência (8 semanas)
- Pizza chart por grupo muscular
- Volume semanal em barras

**🥩 Dieta com IA**
- Digite qualquer refeição em linguagem natural
- Gemini busca os macros reais (tabela TACO brasileira)
- Macro rings animados (kcal, proteína, carbo, gordura)
- Controle de hidratação
- Gráficos semanais

**💾 Dados 100% locais — localStorage, sem servidor, sem conta**

---

## 🛠 Rodar localmente

```bash
npm install
cp .env.example .env.local
# adicione sua GEMINI_API_KEY no .env.local
npm run dev
```

Abra http://localhost:3000
