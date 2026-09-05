import { PermissionFlagsBits } from 'discord.js';
import { config } from '../config/index.js';

/**
 * Reune os cargos de staff globais com os cargos especificos de uma categoria.
 *
 * @param {object|null} category
 * @returns {string[]}
 */
export function staffRoleIdsFor(category = null) {
  const extra = category?.staffRoleIds ?? [];
  return [...new Set([...config.tickets.staffRoleIds, ...extra])];
}

/**
 * Indica se o membro pertence a equipe de atendimento.
 * Administradores do servidor sempre sao considerados staff.
 *
 * @param {import('discord.js').GuildMember|null} member
 * @param {object|null} category
 * @returns {boolean}
 */
export function isStaff(member, category = null) {
  if (!member) {
    return false;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  return staffRoleIdsFor(category).some((roleId) => member.roles.cache.has(roleId));
}

/**
 * Verifica se o bot possui as permissoes necessarias no servidor.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {string[]} lista de permissoes ausentes
 */
export function missingBotPermissions(guild) {
  const required = {
    ManageChannels: PermissionFlagsBits.ManageChannels,
    ManageRoles: PermissionFlagsBits.ManageRoles,
    ViewChannel: PermissionFlagsBits.ViewChannel,
    SendMessages: PermissionFlagsBits.SendMessages,
    EmbedLinks: PermissionFlagsBits.EmbedLinks,
    AttachFiles: PermissionFlagsBits.AttachFiles,
    ReadMessageHistory: PermissionFlagsBits.ReadMessageHistory,
  };

  const me = guild.members.me;

  if (!me) {
    return Object.keys(required);
  }

  return Object.entries(required)
    .filter(([, flag]) => !me.permissions.has(flag))
    .map(([name]) => name);
}
