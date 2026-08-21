# Cozy Ponto

Um controle de ponto minimalista e aconchegante, com visual inspirado no Notion (estilo database/tabela), para registro de jornada de trabalho, anotação de tarefas diárias e cálculo automático de horas extras.

## ✨ Funcionalidades

- **Tabela estilo Notion** com um dia por linha: data, dia da semana, entrada, saída, total trabalhado, horas extras e descrição/atividades.
- **Colaborador(a) editável** no cabeçalho (padrão: "Julia").
- **Seletor de Mês/Ano** com botão **"Gerar / Resetar Mês"**, que preenche automaticamente todos os dias do mês selecionado — dias úteis já vêm com entrada `17:30` e saída `21:30`, e fins de semana ficam em branco.
- **Jornada diária padrão configurável** (padrão `04:00`), usada no cálculo de horas extras.
- **Edição direta na tabela**: entrada, saída e descrição são editáveis célula a célula.
- **Cálculo automático**:
  - Total de horas trabalhadas = saída − entrada.
  - Horas extras = tempo excedente à jornada padrão (nunca negativo — se trabalhar menos que a jornada, mostra `00:00`).
  - Em finais de semana, todo o tempo registrado conta como hora extra, com um destaque visual "fim de semana".
- **Fins de semana destacados** com um fundo sutil, no estilo Notion.
- **Totais do mês** no rodapé da tabela: total de horas trabalhadas e total de horas extras.
- **Persistência automática** no `localStorage` do navegador — nada é enviado para servidores, os dados ficam salvos por colaborador/mês mesmo depois de fechar a aba.
- **Exportação para Excel (.xlsx)** com relatório organizado (dados + totais).
- **Exportação para PDF / Impressão** de um relatório mensal de ponto pronto para imprimir.

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

## 🧱 Tecnologias

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [xlsx (SheetJS)](https://github.com/SheetJS/sheetjs) para exportação em Excel
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) para exportação em PDF
- [Vitest](https://vitest.dev/) para testes automatizados
- [gh-pages](https://github.com/tschaub/gh-pages) + GitHub Actions para deploy no GitHub Pages

## 📄 Licença

Este projeto ainda não possui uma licença definida.
