# Gamepad Rover Control System

Este é um novo sistema de controle do rover baseado no design do Luna Motion Control Center, especialmente desenvolvido para controle via Xbox gamepad.

## Funcionalidades

### Controles do Xbox Gamepad
- **Velocidade Linear**: Controlada pelos triggers R/L
  - **R Trigger (RT)**: Movimento para frente (0 a +0.44 m/s)
  - **L Trigger (LT)**: Movimento para trás (0 a -0.44 m/s)
- **Velocidade Angular**: Controlada pelo joystick esquerdo (eixo X)
  - **Joystick Esquerdo X**: Rotação (-2.0 a +2.0 rad/s)

### Interface
- **Status do Gamepad**: Indicador visual de conexão do Xbox gamepad
- **Valores em Tempo Real**: Display das velocidades linear e angular atuais
- **Dados dos Sensores**: Área para visualização dos dados recebidos via WebSocket
- **Log de Comandos**: Histórico dos últimos 50 comandos enviados
- **Botão de Emergência**: Parada imediata do rover

### Conectividade
- **WebSocket**: Conexão com `ws://localhost:8000/ws`
- **Auto-reconexão**: Tentativa automática de reconexão em caso de perda de conexão
- **Protocolo de Comando**: 
  ```json
  {
    "v": 0.000,  // velocidade linear (m/s)
    "w": 0.000   // velocidade angular (rad/s)
  }
  ```

## Como Usar

1. **Conectar o Xbox Gamepad**:
   - Conecte um Xbox gamepad via USB ou Bluetooth
   - O status será exibido na interface automaticamente

2. **Abrir a Interface**:
   - Abra o arquivo `index.html` em um navegador moderno
   - Certifique-se de que o servidor WebSocket está rodando em `localhost:8000`

3. **Controlar o Rover**:
   - Use o **R Trigger** para mover para frente
   - Use o **L Trigger** para mover para trás
   - Use o **joystick esquerdo** (eixo X) para rotacionar
   - Use o **botão de emergência** para parar imediatamente

## Características Técnicas

### Dead Zones
- **Gamepad**: 0.15 (15% do range total)
- **Triggers**: 0.05 (5% do range total)

### Frequência de Atualização
- **20 Hz** (50ms entre atualizações)

### Limites de Velocidade
- **Linear**: ±0.44 m/s
- **Angular**: ±2.0 rad/s

### Compatibilidade
- Navegadores com suporte à **Gamepad API**
- Xbox One/Series controllers
- Xbox 360 controllers
- Outros gamepads compatíveis com padrão Xbox

## Design

A interface segue o mesmo padrão visual do Luna Motion Control Center:
- **Cores**: Esquema azul escuro (#000d23, #001330)
- **Layout**: Painéis laterais + painel central
- **Tipografia**: Arial, fontes monospace para dados técnicos
- **Responsividade**: Adaptável para dispositivos móveis

## Estrutura de Arquivos

```
new-gamepad-rover/
├── index.html                 # Interface principal
├── gamepad-rover-control.js   # Lógica de controle do gamepad
├── style.css                  # Estilos CSS
└── README.md                  # Esta documentação
```

## Dependências

- **Assets**: Utiliza imagens da pasta `../ASSETS/` do projeto principal
- **WebSocket Server**: Servidor rodando em `localhost:8000/ws`
- **Gamepad API**: Suporte nativo do navegador

## Notas de Desenvolvimento

- O sistema envia comandos apenas quando há mudança significativa nos valores (>0.01)
- Parada automática do rover quando o gamepad é desconectado
- Log automático de todos os comandos enviados
- Tratamento de erros e reconexão automática do WebSocket
