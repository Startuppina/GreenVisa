export const LOW_CONFIDENCE_THRESHOLD = 0.8;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const FILE_STATUS = {
  IDLE: 'idle',
  INVALID: 'invalid',
  READY: 'ready',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const STATUS_LABELS = {
  [FILE_STATUS.IDLE]: 'In attesa',
  [FILE_STATUS.INVALID]: 'Non valido',
  [FILE_STATUS.READY]: 'Pronto',
  [FILE_STATUS.UPLOADING]: 'Caricamento…',
  [FILE_STATUS.UPLOADED]: 'Caricato',
  [FILE_STATUS.PROCESSING]: 'Elaborazione…',
  [FILE_STATUS.COMPLETED]: 'Completato',
  [FILE_STATUS.FAILED]: 'Errore',
  [FILE_STATUS.CANCELLED]: 'Annullato',
};

export const STATUS_COLORS = {
  [FILE_STATUS.IDLE]: 'bg-gray-200 text-gray-700',
  [FILE_STATUS.INVALID]: 'bg-red-100 text-red-700',
  [FILE_STATUS.READY]: 'bg-blue-100 text-blue-700',
  [FILE_STATUS.UPLOADING]: 'bg-yellow-100 text-yellow-700',
  [FILE_STATUS.UPLOADED]: 'bg-yellow-100 text-yellow-700',
  [FILE_STATUS.PROCESSING]: 'bg-yellow-100 text-yellow-700',
  [FILE_STATUS.COMPLETED]: 'bg-green-100 text-green-700',
  [FILE_STATUS.FAILED]: 'bg-red-100 text-red-700',
  [FILE_STATUS.CANCELLED]: 'bg-gray-200 text-gray-500',
};
