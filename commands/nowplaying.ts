import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { splitBar } from "string-progressbar";
import { bot } from "../index";
import { i18n } from "../utils/i18n";

export default {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription(i18n.__("nowplaying.description")),
  cooldown: 10,
  execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);

    if (!queue || !queue.songs.length)
      return interaction.reply({ content: i18n.__("nowplaying.errorNotQueue"), ephemeral: true }).catch(console.error);

    const song = queue.songs[0];
    const seek = queue.resource.playbackDuration / 1000;
    const left = song?.durationSec! - seek;

    let nowPlaying = new EmbedBuilder()
      .setTitle(i18n.__("nowplaying.embedTitle"))
      .setDescription(`${song.title}\n${song.url}`)
      .setColor("#F8AA2A");

    if (song?.durationSec! > 0) {
      nowPlaying.addFields({
        name: "\u200b",
        value:
          new Date(seek * 1000).toISOString().substr(11, 8) +
          "[" +
          splitBar(song?.durationSec! == 0 ? seek : song?.durationSec!, seek, 20)[0] +
          "]" +
          (song?.durationSec! == 0 ? " ◉ LIVE" : new Date(song?.durationSec! * 1000).toISOString().substr(11, 8)),
        inline: false
      });

      nowPlaying.setFooter({
        text: i18n.__mf("nowplaying.timeRemaining", {
          time: new Date(left * 1000).toISOString().substr(11, 8)
        })
      });
    }

    return interaction.reply({ embeds: [nowPlaying] });
  }
};
