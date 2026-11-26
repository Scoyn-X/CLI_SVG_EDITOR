import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // vscode-extension 是独立包，依赖与 tsconfig 在包内；根目录只检查 CLI 与其测试/脚本。
  { ignores: ['node_modules/**', 'dist/**', 'vscode-extension/**', 'coverage/**', 'artifacts/**'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
