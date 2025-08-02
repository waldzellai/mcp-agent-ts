/**
 * MIME type utilities
 */

/**
 * Common MIME types
 */
export const MimeTypes = {
    // Text
    TEXT_PLAIN: 'text/plain',
    TEXT_HTML: 'text/html',
    TEXT_CSS: 'text/css',
    TEXT_JAVASCRIPT: 'text/javascript',
    TEXT_MARKDOWN: 'text/markdown',
    TEXT_CSV: 'text/csv',
    TEXT_XML: 'text/xml',
    
    // Application
    APPLICATION_JSON: 'application/json',
    APPLICATION_XML: 'application/xml',
    APPLICATION_PDF: 'application/pdf',
    APPLICATION_ZIP: 'application/zip',
    APPLICATION_OCTET_STREAM: 'application/octet-stream',
    
    // Image
    IMAGE_PNG: 'image/png',
    IMAGE_JPEG: 'image/jpeg',
    IMAGE_GIF: 'image/gif',
    IMAGE_SVG: 'image/svg+xml',
    IMAGE_WEBP: 'image/webp',
    
    // Audio
    AUDIO_MP3: 'audio/mpeg',
    AUDIO_WAV: 'audio/wav',
    AUDIO_OGG: 'audio/ogg',
    
    // Video
    VIDEO_MP4: 'video/mp4',
    VIDEO_WEBM: 'video/webm',
    VIDEO_OGG: 'video/ogg'
} as const;

export type MimeType = typeof MimeTypes[keyof typeof MimeTypes];

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
    // Remove leading dot if present
    const ext = extension.startsWith('.') ? extension.slice(1) : extension;
    
    const mimeMap: Record<string, string> = {
        // Text
        'txt': MimeTypes.TEXT_PLAIN,
        'html': MimeTypes.TEXT_HTML,
        'htm': MimeTypes.TEXT_HTML,
        'css': MimeTypes.TEXT_CSS,
        'js': MimeTypes.TEXT_JAVASCRIPT,
        'mjs': MimeTypes.TEXT_JAVASCRIPT,
        'md': MimeTypes.TEXT_MARKDOWN,
        'csv': MimeTypes.TEXT_CSV,
        'xml': MimeTypes.TEXT_XML,
        
        // Application
        'json': MimeTypes.APPLICATION_JSON,
        'pdf': MimeTypes.APPLICATION_PDF,
        'zip': MimeTypes.APPLICATION_ZIP,
        
        // Image
        'png': MimeTypes.IMAGE_PNG,
        'jpg': MimeTypes.IMAGE_JPEG,
        'jpeg': MimeTypes.IMAGE_JPEG,
        'gif': MimeTypes.IMAGE_GIF,
        'svg': MimeTypes.IMAGE_SVG,
        'webp': MimeTypes.IMAGE_WEBP,
        
        // Audio
        'mp3': MimeTypes.AUDIO_MP3,
        'wav': MimeTypes.AUDIO_WAV,
        'ogg': MimeTypes.AUDIO_OGG,
        
        // Video
        'mp4': MimeTypes.VIDEO_MP4,
        'webm': MimeTypes.VIDEO_WEBM,
        'ogv': MimeTypes.VIDEO_OGG
    };
    
    return mimeMap[ext.toLowerCase()] || MimeTypes.APPLICATION_OCTET_STREAM;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
    const extensionMap: Record<string, string> = {
        [MimeTypes.TEXT_PLAIN]: 'txt',
        [MimeTypes.TEXT_HTML]: 'html',
        [MimeTypes.TEXT_CSS]: 'css',
        [MimeTypes.TEXT_JAVASCRIPT]: 'js',
        [MimeTypes.TEXT_MARKDOWN]: 'md',
        [MimeTypes.TEXT_CSV]: 'csv',
        [MimeTypes.TEXT_XML]: 'xml',
        [MimeTypes.APPLICATION_JSON]: 'json',
        [MimeTypes.APPLICATION_PDF]: 'pdf',
        [MimeTypes.APPLICATION_ZIP]: 'zip',
        [MimeTypes.IMAGE_PNG]: 'png',
        [MimeTypes.IMAGE_JPEG]: 'jpg',
        [MimeTypes.IMAGE_GIF]: 'gif',
        [MimeTypes.IMAGE_SVG]: 'svg',
        [MimeTypes.IMAGE_WEBP]: 'webp',
        [MimeTypes.AUDIO_MP3]: 'mp3',
        [MimeTypes.AUDIO_WAV]: 'wav',
        [MimeTypes.AUDIO_OGG]: 'ogg',
        [MimeTypes.VIDEO_MP4]: 'mp4',
        [MimeTypes.VIDEO_WEBM]: 'webm',
        [MimeTypes.VIDEO_OGG]: 'ogv'
    };
    
    return extensionMap[mimeType] || 'bin';
}

/**
 * Check if MIME type is text-based
 */
export function isTextMimeType(mimeType: string): boolean {
    return mimeType.startsWith('text/') || 
           mimeType === MimeTypes.APPLICATION_JSON ||
           mimeType === MimeTypes.APPLICATION_XML ||
           mimeType.includes('+json') ||
           mimeType.includes('+xml');
}

/**
 * Check if MIME type is image
 */
export function isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

/**
 * Check if MIME type is audio
 */
export function isAudioMimeType(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
}

/**
 * Check if MIME type is video
 */
export function isVideoMimeType(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

/**
 * Get MIME type category
 */
export function getMimeTypeCategory(mimeType: string): 'text' | 'image' | 'audio' | 'video' | 'binary' {
    if (isTextMimeType(mimeType)) return 'text';
    if (isImageMimeType(mimeType)) return 'image';
    if (isAudioMimeType(mimeType)) return 'audio';
    if (isVideoMimeType(mimeType)) return 'video';
    return 'binary';
}

/**
 * Parse MIME type and extract base type and parameters
 */
export function parseMimeType(mimeType: string): {
    type: string;
    subtype: string;
    parameters: Record<string, string>;
} {
    const parts = mimeType.split(';').map(p => p.trim());
    const [type, subtype] = parts[0].split('/');
    
    const parameters: Record<string, string> = {};
    for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
            parameters[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    }
    
    return { type, subtype, parameters };
}