import { userMention } from 'discord.js';
import { replySuccess } from '../../../utils/interactions.js';
import { requireStaff, requireTicket } from '../../../utils/ticketContext.js';

export default {
  name: 'adicionar',
  description: 'Adiciona um membro ao ticket atual.',
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   * @returns {import('discord.js').SlashCommandSubcommandBuilder}
   */
  register(subcommand) {
    return subcommand.addUserOption((option) =>
      option.setName('membro').setDescription('Membro que sera adicionado.').setRequired(true),
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

    const user = interaction.options.getUser('membro', true);

    await context.services.tickets.addParticipant({ channel: interaction.channel, user });
    await replySuccess(interaction, `${userMention(user.id)} agora tem acesso a este ticket.`);
  },
};
