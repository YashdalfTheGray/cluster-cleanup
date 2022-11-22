module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.eslint.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    // because eslint is stupid as shit about this
    '@typescript-eslint/no-unused-vars': 'off',
    // because eslint is stupid as shit about this
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
  },
};
