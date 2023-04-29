import { AudioResource, createAudioResource, StreamType } from "@discordjs/voice";
import youtube from "youtube-sr";
import { i18n } from "../utils/i18n";
import { videoPattern, isURL, spotifyPattern } from "../utils/patterns";
import { video_basic_info, stream, SpotifyTrack, spotify } from "play-dl";
import { Readable } from "stream";

export interface SongData {
  url: string;
  title: string;
  duration: string;
  thumbnail: string;
  channel: string;
  isLive: boolean;
  durationSec?: number;
}

export class Song {
  public readonly url: string;
  public readonly title: string;
  public readonly duration: string;
  public readonly thumbnail: string;
  public readonly channel: string;
  public readonly isLive: boolean;
  public readonly durationSec?: number;

  public constructor({ url, title, duration, thumbnail, channel, isLive, durationSec }: SongData) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.channel = channel;
    this.isLive = isLive;
    this.durationSec = durationSec;
  }

  public static async from(url: string = "", search: string = "") {
    const isYoutubeUrl = videoPattern.test(url);
    const isSpotifyUrl = spotifyPattern.test(search);

    let songInfo;

    if (isYoutubeUrl) {
      songInfo = await video_basic_info(url);
    } else if (isSpotifyUrl) {
      const spotifyInfo = (await spotify(url)) as SpotifyTrack;
      const spotifyTitle = spotifyInfo.name;
      const spotifyArtist = spotifyInfo.artists[0].name;

      const result = await youtube.searchOne(`${spotifyArtist} - ${spotifyTitle}`);
      songInfo = await video_basic_info(`https://youtube.com/watch?v=${result.id}`);
    } else {
      const result = await youtube.searchOne(search);

      result ? null : console.log(`No results found for ${search}`); // This is for handling the case where no results are found (spotify links for example)

      if (!result) {
        let err = new Error(`No search results found for ${search}`);
        err.name = "NoResults";
        if (isURL.test(url)) err.name = "InvalidURL";

        throw err;
      }

      songInfo = await video_basic_info(`https://youtube.com/watch?v=${result.id}`);
    }
    return new this({
      title: songInfo.video_details.title || "",
      url: songInfo.video_details.url || "",
      thumbnail: songInfo.video_details.thumbnails[0].url,
      channel: songInfo.video_details.channel?.name || "",
      isLive: songInfo.video_details.live,
      duration: songInfo.video_details.durationRaw,
      durationSec: songInfo.video_details.durationInSec
    });
  }

  public async makeResource(): Promise<AudioResource<Song> | void> {
    let playStream;
    let type = this.url.includes("youtube.com") ? StreamType.Opus : StreamType.OggOpus;

    const source = this.url.includes("youtube") ? "youtube" : "soundcloud";

    if (source === "youtube") {
      playStream = await stream(this.url);
    }

    if (!stream) return;

    return createAudioResource(playStream?.stream as Readable, {
      metadata: this,
      inputType: playStream?.type,
      inlineVolume: true
    });
  }

  public startMessage() {
    return {
      author: {
        name: "🎵 | Started playing"
      },
      title: `${this.title}`,
      fields: [
        {
          name: "Channel",
          value: this.channel,
          inline: true
        },
        {
          name: "Duration",
          value: this.isLive ? "🔴 Live" : this.duration.toString(),
          inline: true
        }
      ],
      duration: this.duration.toString(),
      url: this.url,
      thumbnail: {
        url: this.thumbnail
      }
    };

    //return i18n.__mf("play.startedPlaying", { title: this.title, url: this.url });
  }
}
