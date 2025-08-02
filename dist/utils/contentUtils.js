"use strict";
/**
 * Helper functions for working with content objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getText = getText;
exports.getImageData = getImageData;
exports.getMimeType = getMimeType;
exports.isTextContent = isTextContent;
exports.isImageContent = isImageContent;
exports.contentToText = contentToText;
/**
 * Extract text content from a content object if available
 */
function getText(content) {
    // Direct text content
    if ('type' in content && content.type === 'text' && 'text' in content) {
        return content.text;
    }
    // Text resource contents
    if ('text' in content && typeof content.text === 'string') {
        return content.text;
    }
    // Embedded resource with text
    if ('type' in content && content.type === 'resource' && 'resource' in content) {
        const embedded = content;
        if ('text' in embedded.resource) {
            return embedded.resource.text;
        }
    }
    return null;
}
/**
 * Extract image data from a content object if available
 */
function getImageData(content) {
    // Direct image content
    if ('type' in content && content.type === 'image' && 'data' in content) {
        return content.data;
    }
    // Embedded resource with blob
    if ('type' in content && content.type === 'resource' && 'resource' in content) {
        const embedded = content;
        if ('blob' in embedded.resource) {
            return embedded.resource.blob;
        }
    }
    return null;
}
/**
 * Extract MIME type from a content object if available
 */
function getMimeType(content) {
    // Image content has mimeType
    if ('type' in content && content.type === 'image' && 'mimeType' in content) {
        return content.mimeType;
    }
    // Resource contents might have mimeType
    if ('mimeType' in content && typeof content.mimeType === 'string') {
        return content.mimeType;
    }
    // Embedded resource
    if ('type' in content && content.type === 'resource' && 'resource' in content) {
        const embedded = content;
        if ('mimeType' in embedded.resource) {
            return embedded.resource.mimeType;
        }
    }
    return null;
}
/**
 * Check if content is text-based
 */
function isTextContent(content) {
    return getText(content) !== null;
}
/**
 * Check if content is image-based
 */
function isImageContent(content) {
    return getImageData(content) !== null;
}
/**
 * Convert content array to plain text
 */
function contentToText(contents) {
    return contents
        .map(content => {
        const text = getText(content);
        if (text)
            return text;
        if (isImageContent(content)) {
            const mimeType = getMimeType(content) || 'unknown';
            return `[Image: ${mimeType}]`;
        }
        return '[Unknown content]';
    })
        .join('\n');
}
