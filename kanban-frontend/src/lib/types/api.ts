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
  membership_status: 'joined' | 'pending';
  invitation_id?: number;
  invitation_status?: string;
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

export interface UserSearchResult {
  user_id: number;
  email: string;
  display_name: string;
  avatar_url?: string;
}

export interface Conversation {
  conversation_id: number;
  updated_at: string;
  other_user_id: number;
  other_user_email: string;
  other_user_display_name: string;
  other_user_avatar_url?: string;
  last_message_id?: number;
  last_message_content?: string;
  last_message_sender_user_id?: number;
  last_message_created_at?: string;
}

export interface DirectMessage {
  message_id: number;
  conversation_id: number;
  sender_user_id: number;
  content: string;
  created_at: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
}

export interface NotificationItem {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

export interface CanceledCardSnapshot {
  canceled_card_id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: string;
  assigned_user_id?: number | null;
  original_column_name: string;
  canceled_at: string;
}

export interface CanceledColumnEntry {
  canceled_group_id: number;
  column_name: string;
  canceled_at: string;
  cards: CanceledCardSnapshot[];
}

export interface CanceledItemsResponse {
  entries: CanceledColumnEntry[];
  orphan_cards: CanceledCardSnapshot[];
}

export interface Invitation {
  invitation_id: number;
  project_id: number;
  inviter_user_id: number;
  invitee_user_id?: number;
  invitee_email: string;
  role_id: number;
  role_name?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  message?: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  project_name?: string;
  inviter_display_name?: string;
}

// API envelope
export interface ApiResponse<T> {
  data: T;
  message: string;
  error: null | { code: string; message: string };
}
