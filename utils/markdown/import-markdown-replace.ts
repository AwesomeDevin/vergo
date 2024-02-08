const importRegex = /import\s+([\w-]+)\s+from\s+['"]([^'"]+\.mdx?)['"]\s*;?/g

const tagRegex = (tagName) => new RegExp(`<${tagName}[^>]*>`, 'g')

/**
 * replace import statement to <embed />
 */
export const importMarkdownReplace = (content: string) => {
  let modifiedContent = content
  let mdImportMatch
  while ((mdImportMatch = importRegex.exec(content)) !== null) {
    const [importer, tagName, tagValue] = mdImportMatch
    const hasTag = modifiedContent.match(tagRegex(tagName))
    if (hasTag) {
      // delete import line
      modifiedContent = modifiedContent.replace(importer, '')
      // replace tagName with embed and set tagValue to src
      modifiedContent = modifiedContent.replace(
        tagRegex(tagName),
        `<embed src="${tagValue}"></embed>`
      )
    }
  }
  return modifiedContent
}
