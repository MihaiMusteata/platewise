const DIACRITICS: Record<string, string> = {
  ă: 'a',
  â: 'a',
  á: 'a',
  à: 'a',
  ä: 'a',
  î: 'i',
  í: 'i',
  ș: 's',
  ş: 's',
  ț: 't',
  ţ: 't',
  é: 'e',
  è: 'e',
  ë: 'e',
  ó: 'o',
  ö: 'o',
  ú: 'u',
  ü: 'u',
};

const DIACRITICS_RE = new RegExp(`[${Object.keys(DIACRITICS).join('')}]`, 'g');

/** Lowercase, Romanian diacritics stripped, whitespace collapsed — for search matching. */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(DIACRITICS_RE, (ch) => DIACRITICS[ch])
    .replace(/\s+/g, ' ')
    .trim();
}
