/**
 * Helper functions for working with content objects
 */

import {
    TextContent,
    ImageContent,
    EmbeddedResource,
    ResourceContents
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Extract text content from a content object if available
 */
export function getText(
    content: TextContent | ImageContent | EmbeddedResource | ResourceContents
): string | null {
    // Direct text content
    if ('type' in content && content.type === 'text' && 'text' in content) {
        return (content as TextContent).text;
    }

    // Text resource contents
    if ('text' in content && typeof content.text === 'string') {
        return content.text;
    }

    // Embedded resource with text
    if ('type' in content && content.type === 'resource' && 'resource' in content) {
        const embedded = content as EmbeddedResource;
        if ('text' in embedded.resource) {
            return embedded.resource.text as string;
        }
    }

    return null;
}

/**
 * Extract image data from a content object if available
 */
export function getImageData(
    content: TextContent | ImageContent | EmbeddedResource
): string | null {
    // Direct image content
    if ('type' in content && content.type === 'image' && 'data' in content) {
        return (content as ImageContent).data;
    }

    // Embedded resource with blob
    if ('type' in content && content.type === 'resource' && 'resource' in content) {
        const embedded = content as EmbeddedResource;
        if ('blob' in embedded.resource) {
            return embedded.resource.blob as string;
        }
    }

    return null;
}

/**
 * Extract MIME type from a content object if available
 */
export function getMimeType(
    content: TextContent | ImageContent | EmbeddedResource | ResourceContents
): string | null {
    // Image content has mimeType
    if ('type' in content && content.type === 'image' && 'mimeType' in content) {
        return (content as ImageContent).mimeType;
    }

    // Resource contents might have mimeType
    if ('mimeType' in content && typeof content.mimeType === 'string') {
        return content.mimeType;
    }

    // Embedded resource
    if ('type' in content && content.type === 'resource' && 'resource' in content) {
        const embedded = content as EmbeddedResource;
        if ('mimeType' in embedded.resource) {
            return embedded.resource.mimeType as string;
        }
    }

    return null;
}

/**
 * Check if content is text-based
 */
export function isTextContent(
    content: TextContent | ImageContent | EmbeddedResource | ResourceContents
): boolean {
    return getText(content) !== null;
}

/**
 * Check if content is image-based
 */
export function isImageContent(
    content: TextContent | ImageContent | EmbeddedResource
): boolean {
    return getImageData(content) !== null;
}

/**
 * Convert content array to plain text
 */
export function contentToText(
    contents: Array<TextContent | ImageContent | EmbeddedResource>
): string {
    return contents
        .map(content => {
            const text = getText(content);
            if (text) return text;
            
            if (isImageContent(content)) {
                const mimeType = getMimeType(content) || 'unknown';
                return `[Image: ${mimeType}]`;
            }
            
            return '[Unknown content]';
        })
        .join('\n');
}