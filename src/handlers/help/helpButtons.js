import { createEmbed } from '../../utils/embeds.js';
import { createAllCommandsMenu } from './helpSelectMenus.js';
import { createInitialHelpMenu } from '../../commands/Core/help.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { logger } from '../../utils/logger.js';

const BACK_BUTTON_ID = "help-back-to-main";
const PAGINATION_PREFIX = "help-page";
const SUPPORT_SERVER_BUTTON_ID = "help-support-server";

const DISCORD_SERVER_URL = "https://discord.gg/CdGddfWQZq";
const YOUTUBE_URL = "https://youtube.com/@top_labowi?si=HVHzdR5ORvlWwxJT";

export const helpBackButton = {
    name: BACK_BUTTON_ID,
    async execute(interaction, client) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            const { embeds, components } = await createInitialHelpMenu(client);
            await interaction.editReply({
                embeds,
                components,
            });
        } catch (error) {
            if (error?.code === 40060 || error?.code === 10062) {
                logger.warn('Help back button interaction already acknowledged or expired.', {
                    event: 'interaction.help.button.unavailable',
                    errorCode: String(error.code),
                    customId: interaction.customId,
                    interactionId: interaction.id,
                });
                return;
            }

            throw error;
        }
    },
};

export const helpSupportServerButton = {
    name: SUPPORT_SERVER_BUTTON_ID,
    async execute(interaction, client) {
        const supportButton = new ButtonBuilder()
            .setLabel('💬 Join Support Server')
            .setStyle(ButtonStyle.Link)
            .setURL(DISCORD_SERVER_URL);

        const youtubeButton = new ButtonBuilder()
            .setLabel('📺 YouTube Channel')
            .setStyle(ButtonStyle.Link)
            .setURL(YOUTUBE_URL);

        const actionRow = new ActionRowBuilder().addComponents(supportButton, youtubeButton);

        const supportEmbed = createEmbed({
            title: '🛠️ Support & Community',
            description: 'Need help, want to report a bug, or looking for updates? Join our official support server or check out our YouTube channel!\n\n' +
                '• 💬 **Support Server:** Get direct help and connect with the community.\n' +
                '• 📺 **YouTube:** Watch tutorials and updates.\n\n' +
                'We are always happy to help you!',
            color: 'primary'
        });
        supportEmbed.setFooter({
            text: 'DZ TOP | MODS Support System',
            iconURL: client.user.displayAvatarURL()
        });
        supportEmbed.setTimestamp();

        await interaction.reply({
            embeds: [supportEmbed],
            components: [actionRow],
            flags: MessageFlags.Ephemeral
        });
    },
};

function getPaginationInfo(components) {
    for (const row of components || []) {
        for (const component of row.components || []) {
            if (component.customId === `${PAGINATION_PREFIX}_page`) {
                const label = component.label || '';
                const match = label.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
                if (match) {
                    return {
                        currentPage: Number(match[1]),
                        totalPages: Number(match[2]),
                    };
                }
            }
        }
    }

    return { currentPage: 1, totalPages: 1 };
}

export const helpPaginationButton = {
    name: `${PAGINATION_PREFIX}_next`,
    async execute(interaction, client) {
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            const { currentPage, totalPages } = getPaginationInfo(interaction.message?.components);

            let nextPage = currentPage;
            switch (interaction.customId) {
                case `${PAGINATION_PREFIX}_first`:
                    nextPage = 1;
                    break;
                case `${PAGINATION_PREFIX}_prev`:
                    nextPage = Math.max(1, currentPage - 1);
                    break;
                case `${PAGINATION_PREFIX}_next`:
                    nextPage = Math.min(totalPages, currentPage + 1);
                    break;
                case `${PAGINATION_PREFIX}_last`:
                    nextPage = totalPages;
                    break;
                default:
                    nextPage = currentPage;
                    break;
            }

            const { embeds, components } = await createAllCommandsMenu(nextPage, client);
            await interaction.editReply({ embeds, components });
        } catch (error) {
            if (error?.code === 40060 || error?.code === 10062) {
                logger.warn('Help pagination interaction already acknowledged or expired.', {
                    event: 'interaction.help.pagination.unavailable',
                    errorCode: String(error.code),
                    customId: interaction.customId,
                    interactionId: interaction.id,
                });
                return;
            }

            throw error;
        }
    },
};
