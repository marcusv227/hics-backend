const ID_SHAPE = /^[a-zA-Z0-9_-]{11}$/;

/** Extracts the 11-char YouTube video id from a URL (watch/youtu.be/embed/shorts) or a bare id. Returns null if not recognizable. */
export function extractYoutubeId(input: string): string | null {
  const value = input.trim();
  if (ID_SHAPE.test(value)) {
    return value;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/** Converts "m:ss" or "mm:ss" into total seconds. Returns null if the shape doesn't match. */
export function parseMinuteSecondDuration(input: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!match) {
    return null;
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (seconds > 59) {
    return null;
  }
  return minutes * 60 + seconds;
}
