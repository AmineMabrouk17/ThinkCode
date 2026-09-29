"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/resource-utils";

/**
 * The 16:9 preview of a YouTube resource.
 *
 * Nothing from YouTube loads until you ask for it: the first paint is just the
 * static thumbnail served from `i.ytimg.com`, and "Play here" swaps it for a
 * `youtube-nocookie.com` iframe so watching here sets no tracking cookies. The
 * same link always stays available for the "Watch ↗" case — someone who does
 * not want an embedded player can just leave.
 *
 * The image is `unoptimized` on purpose: the Workers runtime has no image
 * optimizer behind `/_next/image`, so the raw CDN URL is the honest one.
 */
export function YouTubePlayer({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface-2">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(videoId)}
            title={`${title} — video player`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <>
            <Image
              src={youtubeThumbnail(videoId)}
              alt={`Thumbnail for ${title}`}
              width={480}
              height={270}
              unoptimized
              className="h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-lg text-white">
                ▶
              </span>
            </span>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPlaying((value) => !value)}
        aria-expanded={playing}
        className="w-fit"
      >
        {playing ? "⏹ Stop preview" : "▶ Play here"}
      </Button>
    </div>
  );
}
