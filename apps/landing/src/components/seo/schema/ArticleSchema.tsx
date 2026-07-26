import JsonLdScript from '../JsonLdScript'
import { buildArticleSchema } from '../../../seo/schema/builders'
import type { ArticleInput } from '../../../seo/schema/types'

export default function ArticleSchema(props: ArticleInput) {
  return <JsonLdScript id="schema-article" data={buildArticleSchema(props)} />
}
