import { BatchJob, ProcessStatus } from '../../../types';

export interface AgentMetadata {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'Marketing' | 'Design' | 'Video' | 'Utility' | 'Analysis' | 'Automation';
    priority: number;
    isPremium?: boolean;
    processFn: (
        job: BatchJob, 
        config: any, 
        updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
    ) => Promise<void>;
}

class AgentRegistry {
    private agents: Map<string, AgentMetadata> = new Map();

    register(agent: AgentMetadata) {
        if (this.agents.has(agent.id)) {
            console.warn(`[Registry] Agent ${agent.id} already exists. Overwriting...`);
        }
        this.agents.set(agent.id, agent);
    }

    getAgent(id: string): AgentMetadata | undefined {
        return this.agents.get(id);
    }

    getAllAgents(): AgentMetadata[] {
        return Array.from(this.agents.values()).sort((a, b) => a.priority - b.priority);
    }
    
    getAgentsByCategory(category: string): AgentMetadata[] {
        return this.getAllAgents().filter(a => a.category === category);
    }
}

export const globalAgentRegistry = new AgentRegistry();
