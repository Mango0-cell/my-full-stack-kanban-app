export interface User {
  user_id: number;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  theme?: string;
  timezone?: string;
  language?: string;
  job_title?: string;
  location?: string;
  website_url?: string;
  notification_settings?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  project_id: number;
  owner_user_id: number;
  project_name: string;
  description?: string;
  member_role?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_member_id?: number;
  project_id: number;
  user_id: number;
  role_id?: number;
  role_name: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  joined_at: string;
}

export interface Column {
  column_id: number;
  project_id: number;
  created_by_user_id: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  card_id: number;
  column_id: number;
  created_by_user_id: number;
  assigned_user_id?: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  comment_id: number;
  card_id: number;
  user_id: number;
  display_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  activity_id: number;
  card_id: number;
  user_id: number;
  display_name: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface AuthResponse {
  user: Pick<User, 'user_id' | 'email' | 'display_name'>;
  token: string;
}

// API envelope
export interface ApiResponse<T> {
  data: T;
  message: string;
  error: null | { code: string; message: string };
}
