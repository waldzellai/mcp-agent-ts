"use strict";
/**
 * MIME type utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimeTypes = void 0;
exports.getMimeTypeFromExtension = getMimeTypeFromExtension;
exports.getExtensionFromMimeType = getExtensionFromMimeType;
exports.isTextMimeType = isTextMimeType;
exports.isImageMimeType = isImageMimeType;
exports.isAudioMimeType = isAudioMimeType;
exports.isVideoMimeType = isVideoMimeType;
exports.getMimeTypeCategory = getMimeTypeCategory;
exports.parseMimeType = parseMimeType;
/**
 * Common MIME types
 */
exports.MimeTypes = {
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
};
/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(extension) {
    // Remove leading dot if present
    const ext = extension.startsWith('.') ? extension.slice(1) : extension;
    const mimeMap = {
        // Text
        'txt': exports.MimeTypes.TEXT_PLAIN,
        'html': exports.MimeTypes.TEXT_HTML,
        'htm': exports.MimeTypes.TEXT_HTML,
        'css': exports.MimeTypes.TEXT_CSS,
        'js': exports.MimeTypes.TEXT_JAVASCRIPT,
        'mjs': exports.MimeTypes.TEXT_JAVASCRIPT,
        'md': exports.MimeTypes.TEXT_MARKDOWN,
        'csv': exports.MimeTypes.TEXT_CSV,
        'xml': exports.MimeTypes.TEXT_XML,
        // Application
        'json': exports.MimeTypes.APPLICATION_JSON,
        'pdf': exports.MimeTypes.APPLICATION_PDF,
        'zip': exports.MimeTypes.APPLICATION_ZIP,
        // Image
        'png': exports.MimeTypes.IMAGE_PNG,
        'jpg': exports.MimeTypes.IMAGE_JPEG,
        'jpeg': exports.MimeTypes.IMAGE_JPEG,
        'gif': exports.MimeTypes.IMAGE_GIF,
        'svg': exports.MimeTypes.IMAGE_SVG,
        'webp': exports.MimeTypes.IMAGE_WEBP,
        // Audio
        'mp3': exports.MimeTypes.AUDIO_MP3,
        'wav': exports.MimeTypes.AUDIO_WAV,
        'ogg': exports.MimeTypes.AUDIO_OGG,
        // Video
        'mp4': exports.MimeTypes.VIDEO_MP4,
        'webm': exports.MimeTypes.VIDEO_WEBM,
        'ogv': exports.MimeTypes.VIDEO_OGG
    };
    return mimeMap[ext.toLowerCase()] || exports.MimeTypes.APPLICATION_OCTET_STREAM;
}
/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType) {
    const extensionMap = {
        [exports.MimeTypes.TEXT_PLAIN]: 'txt',
        [exports.MimeTypes.TEXT_HTML]: 'html',
        [exports.MimeTypes.TEXT_CSS]: 'css',
        [exports.MimeTypes.TEXT_JAVASCRIPT]: 'js',
        [exports.MimeTypes.TEXT_MARKDOWN]: 'md',
        [exports.MimeTypes.TEXT_CSV]: 'csv',
        [exports.MimeTypes.TEXT_XML]: 'xml',
        [exports.MimeTypes.APPLICATION_JSON]: 'json',
        [exports.MimeTypes.APPLICATION_PDF]: 'pdf',
        [exports.MimeTypes.APPLICATION_ZIP]: 'zip',
        [exports.MimeTypes.IMAGE_PNG]: 'png',
        [exports.MimeTypes.IMAGE_JPEG]: 'jpg',
        [exports.MimeTypes.IMAGE_GIF]: 'gif',
        [exports.MimeTypes.IMAGE_SVG]: 'svg',
        [exports.MimeTypes.IMAGE_WEBP]: 'webp',
        [exports.MimeTypes.AUDIO_MP3]: 'mp3',
        [exports.MimeTypes.AUDIO_WAV]: 'wav',
        [exports.MimeTypes.AUDIO_OGG]: 'ogg',
        [exports.MimeTypes.VIDEO_MP4]: 'mp4',
        [exports.MimeTypes.VIDEO_WEBM]: 'webm',
        [exports.MimeTypes.VIDEO_OGG]: 'ogv'
    };
    return extensionMap[mimeType] || 'bin';
}
/**
 * Check if MIME type is text-based
 */
function isTextMimeType(mimeType) {
    return mimeType.startsWith('text/') ||
        mimeType === exports.MimeTypes.APPLICATION_JSON ||
        mimeType === exports.MimeTypes.APPLICATION_XML ||
        mimeType.includes('+json') ||
        mimeType.includes('+xml');
}
/**
 * Check if MIME type is image
 */
function isImageMimeType(mimeType) {
    return mimeType.startsWith('image/');
}
/**
 * Check if MIME type is audio
 */
function isAudioMimeType(mimeType) {
    return mimeType.startsWith('audio/');
}
/**
 * Check if MIME type is video
 */
function isVideoMimeType(mimeType) {
    return mimeType.startsWith('video/');
}
/**
 * Get MIME type category
 */
function getMimeTypeCategory(mimeType) {
    if (isTextMimeType(mimeType))
        return 'text';
    if (isImageMimeType(mimeType))
        return 'image';
    if (isAudioMimeType(mimeType))
        return 'audio';
    if (isVideoMimeType(mimeType))
        return 'video';
    return 'binary';
}
/**
 * Parse MIME type and extract base type and parameters
 */
function parseMimeType(mimeType) {
    const parts = mimeType.split(';').map(p => p.trim());
    const [type, subtype] = parts[0].split('/');
    const parameters = {};
    for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
            parameters[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    }
    return { type, subtype, parameters };
}
