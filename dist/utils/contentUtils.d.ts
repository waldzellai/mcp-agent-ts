/**
 * Helper functions for working with content objects
 */
import { TextContent, ImageContent, EmbeddedResource, ResourceContents } from '@modelcontextprotocol/sdk/types.js';
/**
 * Extract text content from a content object if available
 */
export declare function getText(content: TextContent | ImageContent | EmbeddedResource | ResourceContents): string | null;
/**
 * Extract image data from a content object if available
 */
export declare function getImageData(content: TextContent | ImageContent | EmbeddedResource): string | null;
/**
 * Extract MIME type from a content object if available
 */
export declare function getMimeType(content: TextContent | ImageContent | EmbeddedResource | ResourceContents): string | null;
/**
 * Check if content is text-based
 */
export declare function isTextContent(content: TextContent | ImageContent | EmbeddedResource | ResourceContents): boolean;
/**
 * Check if content is image-based
 */
export declare function isImageContent(content: TextContent | ImageContent | EmbeddedResource): boolean;
/**
 * Convert content array to plain text
 */
export declare function contentToText(contents: Array<TextContent | ImageContent | EmbeddedResource>): string;
