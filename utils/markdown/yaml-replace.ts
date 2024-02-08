const DEFAULT_YAML_KEY_MAP = {
  sidebar_label: 'title',
  sidebar_position: 'order',
  sidebar_group: 'group',
  sidebar_category: 'category',
}

const yamlRegex = /^\s*---([\s\S]*?)---/

export type TVitdocReplaceYamlParams = Record<string, string>

/**
 * replace yaml keys to new keys
 */
export const yamlReplace = (
  content: string,
  yamlKeyMap?: TVitdocReplaceYamlParams
) => {
  let yamlSectionMatch = content.match(yamlRegex)
  if (yamlSectionMatch) {
    let newYamlSection = yamlSectionMatch[1]
    // 同时替换所有键值对
    newYamlSection = Object.entries(yamlKeyMap || DEFAULT_YAML_KEY_MAP).reduce(
      (yamlContent, [key, newKey]) => {
        // 用字面量方式构建正则表达式以避免特殊字符的问题
        const keyRegex = new RegExp(`^${key}(?=\\s*:)`, 'm')
        const newKeyRegex = new RegExp(`^${newKey}(?=\\s*:)`, 'm')
        // 已存在 newKey 项时不对做替换
        return yamlContent.match(newKeyRegex)
          ? yamlContent
          : yamlContent.replace(keyRegex, newKey)
      },
      newYamlSection
    )

    // 仅替换匹配到的 YAML 部分
    content = content.replace(
      yamlSectionMatch[0],
      `---\n${newYamlSection}\n---`
    )
  }

  return content
}
