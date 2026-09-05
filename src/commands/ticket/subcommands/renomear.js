import { replySuccess } from '../../../utils/interactions.js';
import { requireStaff, requireTicket } from '../../../utils/ticketContext.js';

export default {
  name: 'renomear',
  description: 'Renomeia o canal do ticket atual.',
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   * @returns {import('discord.js').SlashCommandSubcommandBuilder}
   */
  register(subcommand) {
    return subcommand.addStringOption((option) =>
      option
        .setName('nome')
        .setDescription('Novo nome do canal.')
        .setMinLength(2)
        .setMaxLength(90)
        .setRequired(true),
    );
  },
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {object} context
   * @returns {Promise<void>}
   */
  async execute(interaction, context) {
    const ticket = requireTicket(interaction, context);
    requireStaff(interaction, ticket);

    const name = await context.services.tickets.rename({
      channel: interaction.channel,
      ticket,
      name: interaction.options.getString('nome', true),
      moderator: interaction.user,
    });

    await replySuccess(interaction, `Canal renomeado para \`${name}\`.`);
  },
};
