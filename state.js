/**
 * State singleton — todos os módulos importam e mutam este objeto diretamente.
 * Isso garante que todos compartilhem a mesma referência em memória.
 */
export const state = {
  ME: null,
  MU: "",
  RES: {},
  PRD: {},
  USERS: [],
  INVS: [],
};
