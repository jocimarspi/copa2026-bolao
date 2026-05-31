# Uso Obrigatório do Contexto Modularizado (Always On)

Toda e qualquer interação do agente de IA com este repositório deve obrigatoriamente ler e respeitar as definições presentes na pasta `.context/` na raiz do projeto. O arquivo único legado `context.md` foi removido e modularizado.

## Diretrizes para o Agente

1. **Leitura Inicial**:
   - Antes de sugerir qualquer alteração de código, criar planos de implementação ou responder a dúvidas arquiteturais, consulte o índice em `.context/index.md`.
   
2. **Respeito às Restrições**:
   - Sempre consulte `.context/restrictions.md` para garantir que regras críticas de negócio (como o bloqueio de palpites 30 minutos antes do kickoff), regras de pontuação, restrições visuais (CSS Vanilla) e restrições de segurança do Firebase estejam sendo seguidas.
   
3. **Alinhamento Arquitetural**:
   - Consulte `.context/architecture.md` para garantir que o fluxo de dados em tempo real do Firestore, o modelo de banco de dados e a divisão de responsabilidades dos componentes estejam consistentes.
   
4. **Verificação de Stack**:
   - Use `.context/stack.md` para verificar as tecnologias integradas corretas (ex: API Football-Data.org na versão v4 e Firebase Web SDK v12/Cloud Functions v2) e evitar a sugestão de pacotes ou abordagens obsoletas.

5. **Glossário**:
   - Adote os termos listados em `.context/glossary.md` em comunicações, documentações e comentários.
