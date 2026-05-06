const MAX_QUERY_LENGTH = 80;

export const sanitizeSearchQuery = (value: string): string => {
  const normalized = value
    .replace(/[\u0000-\u001F]+/g, ' ')
    .replace(/[,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.slice(0, MAX_QUERY_LENGTH);
};

export const escapeIlikeValue = (value: string): string =>
  value.replace(/[%_,]/g, (match) => `\\${match}`);
