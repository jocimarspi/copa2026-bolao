---
name: Criar Nova Skill
description: Esta skill orienta a criação de novas skills para o ecossistema Bolão Copa 2026, garantindo a estrutura correta de diretórios e metadados.
---

# Skill: Criar Nova Skill

Esta skill fornece um roteiro padronizado para a criação de novas habilidades (skills) que estendem as capacidades dos agentes no projeto Bolão Copa 2026.

## 🏗️ Estrutura de Diretórios

As skills devem ser organizadas no diretório `.agents/skills/`. Cada skill possui sua própria pasta:

```text
.agents/skills/
└── nome-da-skill/
    ├── SKILL.md          # (Obrigatório) Instruções e metadados
    ├── scripts/          # (Opcional) Scripts auxiliares (ex: .sh, .py)
    ├── examples/         # (Opcional) Exemplos de uso ou implementações
    └── resources/        # (Opcional) Templates, imagens ou outros assets
```

## 📝 Formato do SKILL.md

O arquivo `SKILL.md` deve obrigatoriamente começar com um bloco de metadados (YAML frontmatter) contendo apenas `name` e `description`.

### Metadados (Black Box)
```yaml
---
name: nome-da-skill
description: Uma descrição clara e concisa do que a skill faz.
---
```

> [!IMPORTANT]
> A `description` é fundamental para a "fase de descoberta" do agente. Ela deve ser escrita na terceira pessoa e descrever claramente quando a skill deve ser utilizada.

## 🚀 Fluxo de Execução

1.  **Definir o Escopo:** A skill deve focar em uma única tarefa específica (ex: "Revisar Regras do Firestore", "Boas Práticas de Vanilla JS").
2.  **Criar Diretório:** Crie a pasta em `.agents/skills/<nome-da-skill>`.
3.  **Criar SKILL.md:** Adicione os metadados e as instruções detalhadas.
4.  **Adicionar Recursos:** Se a skill depender de scripts ou templates, coloque-os nas pastas correspondentes.
5.  **Validar:** Verifique se a skill é listada corretamente e se as instruções são claras o suficiente para um agente seguir de forma autônoma.

## 💡 Diretrizes e Boas Práticas

- **Instruções Acionáveis:** Use listas numeradas para processos e blocos de código para templates.
- **Evite Ambiguidade:** Se houver caminhos alternativos, use uma estrutura de "Árvore de Decisão".
- **Scripts Black Box:** Se usar scripts, oriente o agente a executar com `--help` para entender o uso sem precisar ler o código fonte.
- **Padrão do Projeto:** Certifique-se de que a nova skill respeita os padrões arquiteturais do Bolão Copa 2026 (ex: uso de variáveis CSS `:root` e importações modularizadas do Firebase).
