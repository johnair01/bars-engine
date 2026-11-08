/** The Council Board's pushed data path and its safe JavaScript assignment. */
export const DATA_PATH = 'board/board_data.json'

export function script(json: string): string {
  const body = json.trim().replace(/;\s*$/, '').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  return `window.__BOARD_DATA__ = ${body};\n`
}
