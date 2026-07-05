import { Agent } from './types';

export function removeAgentById(agents: Agent[], id: string): Agent[] {
  return agents.filter((agent) => agent.id !== id);
}
