import { AgentToken } from '../../agent/types';
export { writeClipboardText } from '../../../utils/clipboard';

export function copyableTokenKey(token: AgentToken | null, plainTokenKeys: Record<string, string>): string {
  if (!token) {
    return '';
  }
  const plainKey = plainTokenKeys[token.id];
  if (plainKey) {
    return plainKey;
  }
  return token.key?.startsWith('lobster_') && !token.key.endsWith('...') ? token.key : '';
}
