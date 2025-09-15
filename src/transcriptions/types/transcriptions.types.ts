import { TranscriptionDto } from '@/transcriptions/dto/transcription.dto';

type TranscriptionPayload = Omit<TranscriptionDto, 'document'>;

export interface BaseTranscriptionPayload {
  documentId: string;
}

export interface TranscriptionSuccessPayload extends BaseTranscriptionPayload {
  status: 'DONE';
  transcription: TranscriptionPayload;
}

export interface TranscriptionFailedPayload extends BaseTranscriptionPayload {
  status: 'FAILED';
  error: string;
}

export type TranscriptionUpdatePayload =
  | TranscriptionSuccessPayload
  | TranscriptionFailedPayload;
