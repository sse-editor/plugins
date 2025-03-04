/**
 * Change Case utilities
 *
 * Collection of Simple Change Case Functions
 */

export const lowerCase = (text: string): string => {
  return text.toLowerCase();
};

export const upperCase = (text: string): string => {
  return text.toUpperCase();
};

export const localeLowerCase = (
  text: string,
  locale: string | string[]
): string => {
  return text.toLocaleLowerCase(locale);
};

export const localeUpperCase = (
  text: string,
  locale: string | string[]
): string => {
  return text.toLocaleUpperCase(locale);
};

export const sentenceCase = (text: string): string => {
  return (
    text.charAt(0).toUpperCase() + text.slice(1, text.length).toLowerCase()
  );
};

export const titleCase = (text: string): string => {
  return text.replace(/\w\S*/g, (word) => {
    return (
      word.charAt(0).toUpperCase() + word.slice(1, word.length).toLowerCase()
    );
  });
};

export const toggleCase = (text: string): string => {
  return text.replace(/\w\S*/g, (word) => {
    return (
      word.charAt(0).toLowerCase() + word.slice(1, word.length).toUpperCase()
    );
  });
};
