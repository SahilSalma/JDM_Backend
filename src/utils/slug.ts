/**
 * Generate a URL-safe slug from a title string.
 * Lowercases, replaces spaces with dashes, and removes non-alphanumeric characters.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // Remove special chars except dashes/underscores
    .replace(/[\s_]+/g, '-')   // Replace whitespace and underscores with dashes
    .replace(/-+/g, '-')        // Collapse multiple dashes
    .replace(/^-+|-+$/g, '');  // Trim leading/trailing dashes
}
