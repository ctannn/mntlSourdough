// Shared, dependency-free rules for the public Oven journal and staff editor.
// Never render raw HTML from a post: React escapes text and this module only
// permits HTTPS cover imagery and HTTP(S) article links.
export const OVEN_BUCKET = 'mntl-oven';
export const OVEN_PUBLIC_ASSETS = 'https://dfyzpflempgtokyhvtlo.supabase.co/storage/v1/object/public/' + OVEN_BUCKET + '/';
export const OVEN_PUBLIC_REST = 'https://dfyzpflempgtokyhvtlo.supabase.co/rest/v1/blog_posts';
export const OVEN_PUBLIC_KEY = 'sb_publishable_Q0akOPZNikRT46IMxE4ddg_V59iZ90C';
export const BLOG_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const BLOG_ALLOWED_IMAGES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
});

export function normalizeSlug(text) {
  return String(text || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90).replace(/-$/, '');
}
export function safeHttpsImageUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.username === '' && url.password === '' && value.length <= 1200 ? url.href : '';
  } catch { return ''; }
}
export function safeStoryLink(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function validateBlogPost(data, status = 'draft') {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Post details are required.'];
  if (!String(data.title || '').trim() || String(data.title).trim().length > 150) errors.push('Enter a title of up to 150 characters.');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(data.slug || '')) || String(data.slug || '').length < 3 || String(data.slug || '').length > 90)
    errors.push('Use a 3–90 character lowercase URL slug with hyphens.');
  if (String(data.excerpt || '').length > 350) errors.push('Summary must be 350 characters or fewer.');
  if (!String(data.category || '').trim() || String(data.category).trim().length > 40) errors.push('Choose a category of up to 40 characters.');
  if (String(data.body || '').length > 60000) errors.push('Story exceeds the 60,000 character limit.');
  if (status === 'published' && String(data.body || '').trim().length < 40) errors.push('Add at least 40 characters of story before publishing.');
  if (data.cover_image_url && !safeHttpsImageUrl(data.cover_image_url)) errors.push('Cover photos must use a valid HTTPS image URL.');
  return errors;
}
export function blogPayload(data, status) {
  const errors = validateBlogPost(data, status);
  if (errors.length) throw new Error(errors.join(' '));
  return {
    title: String(data.title).trim(),
    slug: String(data.slug).trim(),
    excerpt: String(data.excerpt || '').trim(),
    body: String(data.body || '').trim(),
    category: String(data.category || 'Journal').trim(),
    cover_image_url: safeHttpsImageUrl(data.cover_image_url) || null,
    status
  };
}
export function publishedBlogPosts(rows, now = Date.now()) {
  return (Array.isArray(rows) ? rows : []).filter(p =>
    p.status === 'published' && p.published_at &&
    Number.isFinite(Date.parse(p.published_at)) && Date.parse(p.published_at) <= now
  ).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at));
}
export function readableBlogDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  return new Intl.DateTimeFormat('en-CA',{month:'long',day:'numeric',year:'numeric',timeZone:'America/Edmonton'}).format(new Date(value));
}
