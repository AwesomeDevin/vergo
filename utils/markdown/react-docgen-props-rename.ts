const reactDocgenPropsRegex =
  /<ReactDocgenProps\s+path="([^"]+\.(tsx|jsx))"\s*(\/>|>[^<]*<\/ReactDocgenProps>)/g

/**
 * replace ReactDocgenProps to API
 */
export const reactDocgenPropsRename = (content: string) =>
  content.replace(reactDocgenPropsRegex, '<API src="$1.type" />')
