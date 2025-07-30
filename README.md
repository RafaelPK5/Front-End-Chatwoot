# Chatwoot Frontend Dashboard

Um dashboard moderno para o Chatwoot que permite login de administradores e agentes, com interfaces específicas para cada role.

## 🚀 Funcionalidades

### 🔐 Sistema de Autenticação
- Login integrado com a API do Chatwoot
- Autenticação baseada em email e senha
- Persistência de sessão com Zustand
- Roteamento automático baseado no role do usuário

### 👨‍💼 Dashboard Administrativo
- Visão geral da conta
- Lista de agentes com status
- Estatísticas da conta
- Informações de configuração

### 💬 Interface de Agentes
- Lista de conversas em tempo real
- Detalhes completos de cada conversa
- Histórico de mensagens
- Informações dos contatos

## 🛠️ Tecnologias

- **Next.js 15** - Framework React
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS
- **Zustand** - Gerenciamento de estado
- **Axios** - Cliente HTTP

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd chatwoot-frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure a API**
Edite o arquivo `src/lib/api/chatwootAPI.ts` e atualize:
- `CHATWOOT_API_URL` - URL da sua API do Chatwoot
- `ACCOUNT_ID` - ID da sua conta

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse o projeto**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🔧 Configuração da API

### Endpoints Utilizados

- `POST /auth/sign_in` - Login de usuários
- `GET /accounts/{id}/conversations` - Lista de conversas
- `GET /accounts/{id}/conversations/{id}` - Detalhes da conversa
- `GET /accounts/{id}/agents` - Lista de agentes
- `GET /accounts/{id}/account` - Estatísticas da conta

### Estrutura de Resposta Esperada

```json
{
  "auth_token": "token_aqui",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "role": "administrator|agent",
    "account_id": 1
  }
}
```

## 👥 Roles e Permissões

### Administrator
- Acesso ao dashboard administrativo
- Visualização de estatísticas da conta
- Lista de agentes
- Configurações da conta

### Agent
- Acesso à interface de conversas
- Visualização de conversas atribuídas
- Histórico de mensagens
- Informações dos contatos

## 🎨 Interface

### Tela de Login
- Design moderno e responsivo
- Validação de formulário
- Feedback de erros
- Loading states

### Dashboard Administrativo
- Cards com estatísticas
- Tabela de agentes
- Informações da conta
- Layout responsivo

### Interface de Agentes
- Lista de conversas
- Detalhes da conversa selecionada
- Histórico de mensagens
- Informações do contato

## 🔒 Segurança

- Tokens de autenticação armazenados no localStorage
- Validação de roles no frontend
- Tratamento de erros de API
- Logout automático em caso de erro

## 📱 Responsividade

O dashboard é totalmente responsivo e funciona em:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## 🚀 Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Cria a build de produção
npm run start    # Inicia o servidor de produção
npm run lint     # Executa o linter
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma issue no repositório.
