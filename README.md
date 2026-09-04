# Cozy Ponto

Um controle de ponto minimalista e aconchegante, com visual lo-fi inspirado no Notion (estilo database/tabela), para registro de jornada de trabalho, anotação de tarefas diárias e cálculo automático de horas extras.

## ✨ Funcionalidades

- **Tabela estilo Notion** com um dia por linha: data, dia da semana, entrada, saída, total trabalhado, horas extras e descrição/atividades.
- **Colaborador(a) editável** no cabeçalho (padrão: "Julia").
- **Seletor de Mês/Ano** com botão **"Gerar / Resetar Mês"**, que preenche automaticamente todos os dias do mês selecionado — dias úteis já vêm com entrada `17:30` e saída `21:30`, e fins de semana/feriados ficam em branco.
- **Jornada diária padrão configurável** (padrão `04:00`), usada no cálculo de horas extras.
- **Edição direta na tabela**: entrada, saída e descrição são editáveis célula a célula.
- **Cálculo automático**:
  - Total de horas trabalhadas = saída − entrada.
  - Horas extras = tempo excedente à jornada padrão (nunca negativo — se trabalhar menos que a jornada, mostra `00:00`).
  - Em finais de semana e feriados, todo o tempo registrado conta como hora extra, com um destaque visual.
- **Painel de Feriados** (botão "Feriados" no cabeçalho): feriados nacionais e o estadual de São Paulo são calculados automaticamente para o ano selecionado (inclusive os móveis, como Carnaval, Sexta-feira Santa e Corpus Christi) e já tratados como dia não-trabalhado. Você pode desmarcar qualquer um que não valha pra você ou adicionar uma data pessoal (aniversário, feriado municipal etc.) — por padrão ela se repete todo ano automaticamente, sem precisar recadastrar.
- **Fins de semana e feriados destacados** com fundo sutil (tons pastéis diferentes para cada um), no estilo Notion.
- **Dia de hoje em destaque** na tabela (borda lavanda + etiqueta "hoje"), só em dias úteis — some nos fins de semana.
- **Detalhamento de tarefas por dia** (botão "Tarefas" na célula de Descrição): registre o horário exato (início/fim) de cada atividade dentro da sua jornada, com duração calculada automaticamente. Dá pra salvar "tags" de tarefas recorrentes (ex.: "Reunião") pra preencher com um clique, sem redigitar. O detalhamento aparece também no Excel, no PDF e na planilha do Google Sheets.
- **Totais do mês** no rodapé da tabela: total de horas trabalhadas e total de horas extras.
- **Persistência automática** no `localStorage` do navegador — nada é enviado para servidores, os dados ficam salvos por colaborador/mês/ano mesmo depois de fechar a aba.
- **Exportação para Excel (.xlsx)** com relatório organizado (dados + totais).
- **Exportação para PDF / Impressão** de um relatório mensal de ponto pronto para imprimir.
- **Visual cozy/lo-fi**: paleta pastel (lavanda, sálvia e terracota), cantos arredondados, ícones minimalistas (Lucide) e uma frase de acolhimento que muda todo dia no topo do painel.
- **Sincronização opcional com Google Sheets** (botão "Google Sheets" no cabeçalho): manda uma cópia do mês atual pra uma planilha do Google que você já compartilhou com quem precisar acompanhar — sincronização manual ou automática a cada edição. Totalmente opcional: sem configurar nada, o app continua 100% local. Veja a seção [Sincronização com Google Sheets](#-sincronização-com-google-sheets-opcional) abaixo.

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado LTS mais recente)
- npm (instalado junto com o Node.js)

### Passo a passo

1. Clone o repositório:

   ```bash
   git clone https://github.com/atlas436/notion-ponto-app.git
   cd notion-ponto-app
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra o navegador no endereço exibido no terminal (por padrão `http://localhost:5173`).

## 🛠️ Scripts disponíveis

| Comando          | Descrição                                      |
| ---------------- | ----------------------------------------------- |
| `npm install`     | Instala as dependências do projeto              |
| `npm run dev`      | Inicia o ambiente de desenvolvimento (Vite)     |
| `npm run build`    | Gera a versão de produção do projeto            |
| `npm run preview`  | Serve localmente a build de produção            |
| `npm run lint`     | Executa o ESLint no código-fonte                |
| `npm run test`      | Roda a suíte de testes automatizados (Vitest)   |
| `npm run test:watch`| Roda os testes em modo watch, reexecutando a cada alteração |
| `npm run deploy`   | Builda e publica o app no GitHub Pages (branch `gh-pages`) |

## ✅ Testes

A lógica de cálculo de horas (entrada/saída, total trabalhado, horas extras e a regra especial de fim de semana) é coberta por testes automatizados com [Vitest](https://vitest.dev/), em `src/utils/time.test.js`.

```bash
npm run test
```

## 📦 Deploy no GitHub Pages

O projeto já vem configurado para publicação no [GitHub Pages](https://pages.github.com/) usando a biblioteca [`gh-pages`](https://github.com/tschaub/gh-pages).

- O `base` em `vite.config.js` está definido como `/notion-ponto-app/`, para bater com a URL `https://<seu-usuario>.github.io/notion-ponto-app/`. Se você renomear o repositório ou publicar em outro caminho, atualize esse valor (use `base: './'` se preferir caminhos relativos).
- Os scripts `predeploy` e `deploy` já estão no `package.json`.

### Passo a passo

1. Garanta que o repositório já está no GitHub e que o `origin` aponta para ele:

   ```bash
   git remote -v
   ```

2. Rode o deploy (ele executa o build automaticamente via `predeploy`):

   ```bash
   npm run deploy
   ```

   Isso gera a pasta `dist/` e publica seu conteúdo na branch `gh-pages` do repositório.

3. No GitHub, acesse **Settings → Pages** do repositório e configure:
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` / pasta `/ (root)`

4. Após alguns instantes, o site ficará disponível em:

   ```text
   https://<seu-usuario>.github.io/notion-ponto-app/
   ```

5. Para publicar novas atualizações, basta rodar `npm run deploy` novamente sempre que quiser atualizar o site publicado.

### Deploy automático via GitHub Actions

Além do deploy manual, o repositório já inclui o workflow `.github/workflows/deploy.yml`, que automaticamente:

1. Instala as dependências (`npm ci`);
2. Roda a suíte de testes (`npm run test`);
3. Builda o projeto (`npm run build`);
4. Publica o conteúdo de `dist/` na branch `gh-pages`.

Ele dispara a cada push na branch `main` (ajuste o nome no arquivo do workflow se a branch padrão do seu repositório for outra) e também pode ser executado manualmente pela aba **Actions** do GitHub (botão "Run workflow"). Não é necessário configurar nenhum secret adicional — o workflow usa o `GITHUB_TOKEN` padrão do repositório.

## 🔗 Sincronização com Google Sheets (opcional)

Por padrão, o Cozy Ponto é 100% local: nada é enviado pra lugar nenhum. Se você quiser que outra pessoa (ex.: sua
chefe) acompanhe seus registros direto pelo Google Sheets — ferramenta que ela já usa —, dá pra ligar uma
sincronização opcional que manda uma cópia do mês atual pra uma planilha do Google.

Como funciona: você continua usando o Cozy Ponto normalmente; a cada sincronização (manual ou automática), ele
sobrescreve uma aba chamada "Cozy Ponto" dentro da planilha que você escolheu, com os dados do mês selecionado.
Quem tiver acesso a essa planilha no Google Sheets vê a atualização ao vivo, sem precisar abrir o site.

Isso exige duas coisas suas, feitas uma única vez:

### 1. Criar e compartilhar a planilha

1. Crie uma planilha nova em [sheets.google.com](https://sheets.google.com).
2. Compartilhe com o e-mail de quem você quer que acompanhe (permissão de **leitura** já basta pra quem só vai olhar).
3. Copie o link da planilha — você vai colar ele no app.

### 2. Criar um Client ID OAuth gratuito (Google Cloud Console)

Isso é necessário porque o Google exige que qualquer app se identifique antes de poder escrever numa planilha em
seu nome — é um passo de segurança do próprio Google, leva uns 5 minutos e só precisa ser feito uma vez.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie um projeto novo (gratuito).
2. Em **APIs e serviços → Biblioteca**, ative a **Google Sheets API**.
3. Em **APIs e serviços → Tela de consentimento OAuth**, configure como "Externo" e modo "Testing" (não precisa de
   aprovação do Google pra uso pessoal/pequena equipe) — adicione seu e-mail (e o de quem for usar) como usuário de teste.
4. Em **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**, escolha tipo **Aplicativo da Web** e
   em **Origens JavaScript autorizadas** adicione a URL do site (ex.: `https://<seu-usuario>.github.io`).
5. Copie o **Client ID** gerado (termina em `.apps.googleusercontent.com`).

### 3. Usar no app

1. Abra o Cozy Ponto e clique em **"Google Sheets"** no cabeçalho.
2. Cole o **Client ID** e o **link da planilha** nos campos correspondentes.
3. Clique em **"Conectar com Google"** e autorize o acesso na janela que abrir.
4. Clique em **"Sincronizar agora"** sempre que quiser atualizar, ou marque **"Sincronizar automaticamente a cada
   edição"** pra ficar praticamente em tempo real (com um pequeno atraso de ~2s após parar de digitar).

O Client ID e o link da planilha ficam salvos no seu navegador; o token de acesso do Google **não** é salvo em
disco — expira sozinho depois de um tempo e você reconecta clicando no mesmo botão.

## 🧱 Tecnologias

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [xlsx (SheetJS)](https://github.com/SheetJS/sheetjs) para exportação em Excel
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) para exportação em PDF
- [Vitest](https://vitest.dev/) para testes automatizados
- [gh-pages](https://github.com/tschaub/gh-pages) + GitHub Actions para deploy no GitHub Pages
- [Google Identity Services](https://developers.google.com/identity/gsi/web) + [Google Sheets API](https://developers.google.com/sheets/api) para a sincronização opcional

## 📄 Licença

Este projeto ainda não possui uma licença definida.
