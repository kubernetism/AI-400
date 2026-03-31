export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  llm_response?: string;
  llm_loading?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  subtasks: Subtask[];
}
