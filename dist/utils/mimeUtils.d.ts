/**
 * MIME type utilities
 */
/**
 * Common MIME types
 */
export declare const MimeTypes: {
    readonly TEXT_PLAIN: "text/plain";
    readonly TEXT_HTML: "text/html";
    readonly TEXT_CSS: "text/css";
    readonly TEXT_JAVASCRIPT: "text/javascript";
    readonly TEXT_MARKDOWN: "text/markdown";
    readonly TEXT_CSV: "text/csv";
    readonly TEXT_XML: "text/xml";
    readonly APPLICATION_JSON: "application/json";
    readonly APPLICATION_XML: "application/xml";
    readonly APPLICATION_PDF: "application/pdf";
    readonly APPLICATION_ZIP: "application/zip";
    readonly APPLICATION_OCTET_STREAM: "application/octet-stream";
    readonly IMAGE_PNG: "image/png";
    readonly IMAGE_JPEG: "image/jpeg";
    readonly IMAGE_GIF: "image/gif";
    readonly IMAGE_SVG: "image/svg+xml";
    readonly IMAGE_WEBP: "image/webp";
    readonly AUDIO_MP3: "audio/mpeg";
    readonly AUDIO_WAV: "audio/wav";
    readonly AUDIO_OGG: "audio/ogg";
    readonly VIDEO_MP4: "video/mp4";
    readonly VIDEO_WEBM: "video/webm";
    readonly VIDEO_OGG: "video/ogg";
};
export type MimeType = typeof MimeTypes[keyof typeof MimeTypes];
/**
 * Get MIME type from file extension
 */
export declare function getMimeTypeFromExtension(extension: string): string;
/**
 * Get file extension from MIME type
 */
export declare function getExtensionFromMimeType(mimeType: string): string;
/**
 * Check if MIME type is text-based
 */
export declare function isTextMimeType(mimeType: string): boolean;
/**
 * Check if MIME type is image
 */
export declare function isImageMimeType(mimeType: string): boolean;
/**
 * Check if MIME type is audio
 */
export declare function isAudioMimeType(mimeType: string): boolean;
/**
 * Check if MIME type is video
 */
export declare function isVideoMimeType(mimeType: string): boolean;
/**
 * Get MIME type category
 */
export declare function getMimeTypeCategory(mimeType: string): 'text' | 'image' | 'audio' | 'video' | 'binary';
/**
 * Parse MIME type and extract base type and parameters
 */
export declare function parseMimeType(mimeType: string): {
    type: string;
    subtype: string;
    parameters: Record<string, string>;
};
