import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { TicketError } from '../../utils/TicketError.js';
import adicionar from './subcommands/adicionar.js';
import assumir from './subcommands/assumir.js';
import fechar from './subcommands/fechar.js';
import informacoes from './subcommands/informacoes.js';
import remover from './subcommands/remover.js';
import renomear from './subcommands/renomear.js';
import transcricao from './subcommands/transcricao.js';

const subcommands = [
  assumir,
  fechar,
  adicionar,
  remover,
  renomear,
  transcricao,
  informacoes,
];

const registry = new Map(subcommands.map((subcommand) => [subcommand.name, subcommand]));

const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Gerencia o atendimento aberto neste canal.')
  .setContexts(InteractionContextType.Guild);

for (const subcommand of subcommands) {
  data.addSubcommand((builder) =>
    subcommand.register(builder.setName(subcommand.name).setDescription(subcommand.description)),
  );
}

export default {
  data,
  /**
   * Encaminha a execucao para o subcomando correspondente.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const name = interaction.options.getSubcommand();
    const subcommand = registry.get(name);

    if (!subcommand) {
      throw new TicketError('Subcomando indisponivel.');
    }

    await subcommand.execute(interaction, context);
  },
};
