---
name: Documentação de Especificação
description: Esta skill automatiza a persistência de requisitos refinados em arquivos de especificação padronizados.
---
# Skill: Documentação de Especificação

Esta skill garante que o resultado do refinamento seja registrado de forma permanente e organizada no repositório.

## 📋 Padrão de Arquivo

As especificações devem ser salvas no diretório `spec/` seguindo a nomenclatura:
`0000_TITULO_DA_FUNCIONALIDADE.md`

Onde `0000` é um número sequencial (incremente baseado nos arquivos existentes).

## 🏗️ Estrutura do Documento

- Consulte o template padrão em [specification-template.md](examples/specification-template.md).

## 🚀 Como usar esta skill

Ao finalizar um refinamento, utilize:
*"Documente esta especificação utilizando a skill document-specification, salvando o conteúdo no diretório spec/ com o título apropriado."*
