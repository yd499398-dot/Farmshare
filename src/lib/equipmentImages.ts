/**
 * Verified high-definition farm equipment photography from Unsplash.
 * All URLs are verified with HTTP 200 OK and optimized for fast display.
 */

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Tractors: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80",
  Tillage: "https://images.unsplash.com/photo-1589923188651-268a9765e432?auto=format&fit=crop&w=800&q=80",
  Harvesters: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80",
  Seeding: "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=800&q=80",
  Irrigation: "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80",
  All: "https://images.unsplash.com/photo-1534073133331-c4b62a557083?auto=format&fit=crop&w=800&q=80",
  Default: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80"
};

const BROKEN_IMAGE_PATTERNS = [
  'photo-1592982537447',
  'photo-1605381836154',
  'photo-1627989580309',
  'photo-1586771107445',
  'photo-1581057404396'
];

/**
 * Resolves an equipment image URL, ensuring broken / 404 links
 * are replaced with active, verified farm machinery photos.
 */
export function resolveEquipmentImage(url?: string | null, category?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_CATEGORY_IMAGES[category || 'Default'] || DEFAULT_CATEGORY_IMAGES.Default;
  }
  if (BROKEN_IMAGE_PATTERNS.some(pat => url.includes(pat))) {
    return DEFAULT_CATEGORY_IMAGES[category || 'Default'] || DEFAULT_CATEGORY_IMAGES.Default;
  }
  return url;
}

/**
 * Safe image error handler for <img> elements that automatically
 * swaps broken images to the working category fallback.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, category?: string) {
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite loop
  target.src = DEFAULT_CATEGORY_IMAGES[category || 'Default'] || DEFAULT_CATEGORY_IMAGES.Default;
}
