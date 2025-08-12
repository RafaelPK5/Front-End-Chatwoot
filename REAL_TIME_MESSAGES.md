# Sistema de Mensagens em Tempo Real

## Visão Geral

O sistema implementa recepção instantânea de mensagens do Chatwoot usando duas abordagens:

1. **Polling** (implementado) - Busca mensagens a cada 2 segundos
2. **WebSocket** (preparado) - Conexão em tempo real via WebSocket

## Como Funciona

### Hook useRealTimeMessages

O hook `useRealTimeMessages` gerencia a recepção de mensagens em tempo real:

```typescript
const {
  messages: realTimeMessages,
  isConnected,
  error: realTimeError,
  addMessage,
  clearMessages
} = useRealTimeMessages({
  conversationId: selectedConversation?.id,
  enabled: !!selectedConversation?.id,
  pollingInterval: 2000 // Polling a cada 2 segundos
});
```

### Funcionalidades

- **Polling automático**: Busca novas mensagens a cada 2 segundos
- **Detecção de novas mensagens**: Compara IDs para identificar mensagens novas
- **Eventos customizados**: Emite eventos `newMessages` para notificar sobre novas mensagens
- **Reconexão automática**: Tenta reconectar em caso de falha
- **Scroll automático**: Rola para o final quando novas mensagens chegam

### Indicadores Visuais

- **Status de conexão**: Mostra se está conectado em tempo real
- **Indicador de erro**: Exibe erros de conexão
- **Animação de pulso**: Indica atividade em tempo real

## Configuração

### Polling Interval

O intervalo de polling pode ser configurado:

```typescript
useRealTimeMessages({
  pollingInterval: 3000 // 3 segundos
});
```

### WebSocket (Futuro)

Para usar WebSocket em vez de polling:

```typescript
import { useWebSocketMessages } from '../../hooks/useWebSocketMessages';

const {
  messages,
  isConnected,
  error
} = useWebSocketMessages({
  conversationId: selectedConversation?.id,
  enabled: !!selectedConversation?.id,
  wsUrl: 'wss://seu-chatwoot.com/cable'
});
```

## Eventos

### newMessages

Evento customizado emitido quando novas mensagens chegam:

```typescript
window.addEventListener('newMessages', (event: CustomEvent) => {
  const { conversationId, messages } = event.detail;
  // Processar novas mensagens
});
```

## Estrutura das Mensagens

```typescript
interface Message {
  id: number;
  content: string;
  message_type: number; // 0 = recebida, 1 = enviada, 2 = sistema
  content_type: string;
  created_at: string;
  sender: {
    id: number;
    name: string;
    type: string;
  } | null;
}
```

## Troubleshooting

### Problemas Comuns

1. **Mensagens não aparecem**: Verificar se o `conversationId` está correto
2. **Erro de conexão**: Verificar se o token de autenticação é válido
3. **Polling muito lento**: Ajustar o `pollingInterval`

### Logs

O sistema gera logs detalhados no console:

- `🔌 WebSocket conectado` - Conexão estabelecida
- `✅ Mensagem recebida` - Nova mensagem processada
- `❌ Erro na conexão` - Erro de conexão
- `🔄 Tentativa de reconexão` - Tentativa de reconexão

## Performance

- **Polling**: Baixo impacto, adequado para uso geral
- **WebSocket**: Melhor performance, menor latência
- **Cache**: Mensagens são mantidas em estado local
- **Otimização**: Evita re-renders desnecessários
