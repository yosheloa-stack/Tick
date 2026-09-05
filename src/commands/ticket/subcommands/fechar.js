import { MessageFlags } from 'discord.js';
import { warningEmbed } from '../../../utils/embeds.js';
import { requireStaffOrOwner, requireTicket } from '../../../utils/ticketContext.js';

export default {
  name: 'fechar',
  description: 'Encerra o ticket atual e arquiva a transcricao.',
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   * @returns {import('discord.js').SlashCommandSubcommandBuilder}
   */
  register(subcommand) {
    return subcommand.addStringOption((option) =>
      option
        .setName('motivo')
        .setDescription('Motivo do encerramento, registrado no log.')
        .setMaxLength(500)
        .setRequired(false),
    );
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const ticket = requireTicket(interaction, context);
    requireStaffOrOwner(interaction, ticket);

    await interaction.reply({
      embeds: [warningEmbed('Encerrando o atendimento e arquivando a transcricao.')],
      flags: MessageFlags.Ephemeral,
    });

    await context.services.tickets.close({
      channel: interaction.channel,
      ticket,
      moderator: interaction.user,
      reason: interaction.options.getString('motivo'),
    });
  },
};
