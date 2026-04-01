export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  llm_response?: string;
  llm_loading?: boolean;
  agent_id?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  subtasks: Subtask[];
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
}
