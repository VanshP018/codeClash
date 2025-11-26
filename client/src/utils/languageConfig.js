/**
 * Language configuration for code editor
 * Includes Piston API language versions and display information
 */

export const LANGUAGES = {
  python: {
    id: 'python',
    name: 'Python',
    version: '3.10.0',
    icon: '🐍',
    displayName: 'Python 3.10',
    extension: 'py',
    commentSyntax: '#'
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    version: '10.2.0',
    icon: '⚡',
    displayName: 'C++ 17',
    extension: 'cpp',
    commentSyntax: '//'
  },
  java: {
    id: 'java',
    name: 'Java',
    version: '15.0.2',
    icon: '☕',
    displayName: 'Java 15',
    extension: 'java',
    commentSyntax: '//'
  }
};

export const getLanguageConfig = (languageId) => {
  return LANGUAGES[languageId] || LANGUAGES.python;
};

export const getAvailableLanguages = () => {
  return Object.values(LANGUAGES);
};
