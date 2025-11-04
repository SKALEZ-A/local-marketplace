export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateUniqueSlug = async (
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> => {
  let slug = generateSlug(text);
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${generateSlug(text)}-${counter}`;
    counter++;
  }

  return slug;
};

export const slugify = (text: string, options?: { lower?: boolean; strict?: boolean }): string => {
  const opts = {
    lower: true,
    strict: false,
    ...options
  };

  let slug = text.toString();

  if (opts.lower) {
    slug = slug.toLowerCase();
  }

  slug = slug
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, opts.strict ? '' : '-')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  return slug;
};
