import { like } from '../../config/like.js';
import { appearance, categories, panel, tickets } from '../../config/tickets.js';
import { env } from './env.js';

const ID_PATTERN = /^\d{17,20}$/;
const CATEGORY_ID_PATTERN = /^[a-z0-9-]{1,32}$/;
const MAX_MENU_OPTIONS = 25;
const MAX_MODAL_FIELDS = 5;

/**
 * Valida a configuracao carregada e interrompe a inicializacao em caso de erro.
 *
 * @returns {void}
 */
function validate() {
  const errors = [];

  if (!ID_PATTERN.test(tickets.categoryId)) {
    errors.push('tickets.categoryId nao e um ID valido do Discord.');
  }

  if (!ID_PATTERN.test(tickets.logChannelId)) {
    errors.push('tickets.logChannelId nao e um ID valido do Discord.');
  }

  if (tickets.overflowCategoryId && !ID_PATTERN.test(tickets.overflowCategoryId)) {
    errors.push('tickets.overflowCategoryId nao e um ID valido do Discord.');
  }

  if (!Array.isArray(tickets.staffRoleIds) || tickets.staffRoleIds.length === 0) {
    errors.push('tickets.staffRoleIds deve conter ao menos um cargo.');
  } else {
    for (const roleId of tickets.staffRoleIds) {
      if (!ID_PATTERN.test(roleId)) {
        errors.push(`tickets.staffRoleIds contem um ID invalido: ${roleId}`);
      }
    }
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    errors.push('E necessario configurar ao menos uma categoria de ticket.');
  }

  if (categories.length > MAX_MENU_OPTIONS) {
    errors.push(`O menu do painel suporta no maximo ${MAX_MENU_OPTIONS} categorias.`);
  }

  const seen = new Set();

  for (const category of categories) {
    if (!CATEGORY_ID_PATTERN.test(category.id ?? '')) {
      errors.push(
        `Categoria "${category.label ?? category.id}": o campo id deve conter apenas letras minusculas, numeros e hifens.`,
      );
      continue;
    }

    if (seen.has(category.id)) {
      errors.push(`Categoria duplicada: ${category.id}`);
    }

    seen.add(category.id);

    if (!category.label) {
      errors.push(`Categoria "${category.id}": o campo label e obrigatorio.`);
    }

    const questions = category.questions ?? [];

    if (questions.length > MAX_MODAL_FIELDS) {
      errors.push(
        `Categoria "${category.id}": um formulario suporta no maximo ${MAX_MODAL_FIELDS} perguntas.`,
      );
    }

    const questionIds = new Set();

    for (const question of questions) {
      if (!question.id || !question.label) {
        errors.push(`Categoria "${category.id}": toda pergunta precisa de id e label.`);
        continue;
      }

      if (questionIds.has(question.id)) {
        errors.push(`Categoria "${category.id}": pergunta duplicada "${question.id}".`);
      }

      questionIds.add(question.id);
    }
  }

  const auth = ['query', 'header', 'bearer', 'none'];

  if (!Number.isFinite(like.cooldownHours) || like.cooldownHours <= 0) {
    errors.push('like.cooldownHours deve ser um numero maior que zero.');
  }

  try {
    new URL(like.api.path, like.api.baseUrl);
  } catch {
    errors.push('like.api.baseUrl nao e uma URL valida.');
  }

  if (!['GET', 'POST'].includes(like.api.method)) {
    errors.push('like.api.method deve ser GET ou POST.');
  }

  if (!auth.includes(like.api.authStyle)) {
    errors.push(`like.api.authStyle deve ser um destes valores: ${auth.join(', ')}.`);
  }

  if (!Array.isArray(like.regions) || like.regions.length === 0) {
    errors.push('like.regions deve conter ao menos uma regiao.');
  } else if (like.regions.length > MAX_MENU_OPTIONS) {
    errors.push(`like.regions suporta no maximo ${MAX_MENU_OPTIONS} itens.`);
  } else if (!like.regions.some((region) => region.value === like.defaultRegion)) {
    errors.push('like.defaultRegion precisa existir na lista like.regions.');
  }

  if (errors.length > 0) {
    throw new Error(`Configuracao invalida:\n- ${errors.join('\n- ')}`);
  }
}

validate();

/** Mapa de categorias indexado pelo id, para acesso direto. */
const categoryIndex = new Map(categories.map((category) => [category.id, Object.freeze(category)]));

export const config = Object.freeze({
  env,
  appearance: Object.freeze(appearance),
  panel: Object.freeze(panel),
  tickets: Object.freeze(tickets),
  like: Object.freeze(like),
  categories: Object.freeze([...categoryIndex.values()]),
  /**
   * Retorna uma categoria pelo id configurado.
   *
   * @param {string} id
   * @returns {object|null}
   */
  getCategory(id) {
    return categoryIndex.get(id) ?? null;
  },
});

export { env };
