"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
/**
 * Generate a URL-safe slug from a title string.
 * Lowercases, replaces spaces with dashes, and removes non-alphanumeric characters.
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special chars except dashes/underscores
        .replace(/[\s_]+/g, '-') // Replace whitespace and underscores with dashes
        .replace(/-+/g, '-') // Collapse multiple dashes
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
}
//# sourceMappingURL=slug.js.map