export interface EmergencySubmissionPayload {
  title: string;
  categorySlug: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  summary?: string;
  warningText?: string;
  steps: string[];
  dontDo: string[];
  sourceLabel: string;
  youtubeVideoId?: string | null;
}

export interface TrackSubmissionCard {
  title: string;
  text: string;
  tip?: string;
}

export interface TrackSubmissionQuestion {
  statement: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface TrackSubmissionPayload {
  title: string;
  categorySlug: string;
  estimatedMinutes: number;
  cards: TrackSubmissionCard[];
  questions: TrackSubmissionQuestion[];
  sourceLabel: string;
}

export interface VideoSubmissionPayload {
  title: string;
  categorySlug: string;
  youtubeVideoId: string | null;
  durationSeconds: number | null;
  linkedProcedureSlug?: string;
  sourceLabel: string;
}
