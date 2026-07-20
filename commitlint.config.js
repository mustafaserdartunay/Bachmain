export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Transition: warn-level enforcement via CI soft job; local husky can be skipped with --no-verify only for hotfix
    'type-enum': [
      1,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-empty': [1, 'never'],
    'type-empty': [1, 'never'],
  },
}
