import type { CoverKey } from "./project-covers";
export type Role = "member" | "admin";
export interface User {
  id: string;
  display_name: string;
  email: string | null;
  role: Role;
  can_manage_attendance: boolean;
  avatar_url?: string | null;
  avatar_version?: string | null;
}
export interface AvatarOut {
  avatar_url: string;
  avatar_version: string;
  content_type: string;
  byte_size: number;
  width: number;
  height: number;
  updated_at: string;
}
export interface Session {
  user: User;
  csrf_token: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
export interface Project {
  cover_key: CoverKey;
  id: string;
  title: string;
  description: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}
export interface ProjectInput {
  title: string;
  description: string;
}
export interface Documentation {
  id: string;
  project_id: string;
  overview_markdown: string;
  created_at: string;
  updated_at: string;
}
export type ResourceType = "html" | "markdown" | "pdf";
export interface Resource {
  id: string;
  project_id: string;
  title: string;
  original_filename: string;
  filename: string;
  folder_id: string | null;
  resource_type: ResourceType;
  content_type: string;
  byte_size: number;
  sha256: string;
  uploader_id: string;
  created_at: string;
  updated_at: string;
}
export interface Member {
  id: string;
  display_name: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  avatar_version?: string | null;
}
export interface DirectoryStatus {
  last_success_at: string | null;
  stale: boolean;
  error_code: string | null;
  max_age_seconds: number;
}
export type MembersPage = Page<Member> & { directory_status?: DirectoryStatus };
export interface AttendanceInput {
  member_id: string;
  event_type: "late" | "absent";
  event_date: string;
  minutes_late?: number | null;
  note?: string | null;
}
export interface AttendanceEvent extends AttendanceInput {
  id: string;
  creator_id: string;
  editor_id: string;
  created_at: string;
  updated_at: string;
}
export interface Summary {
  member_id: string;
  display_name?: string | null;
  active?: boolean;
  late_count: number;
  absence_count: number;
}
export interface AttendanceFilters {
  member_id?: string;
  date_from?: string;
  date_to?: string;
}
export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface Folder {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}
export interface FolderInput {
  name?: string;
  parent_id?: string | null;
}
export interface ResourcePatch {
  title?: string;
  filename?: string;
  folder_id?: string | null;
}
export type LinkProvider = "github" | "drive" | "other";
export interface ProjectLink {
  id: string;
  project_id: string;
  title: string;
  url: string;
  provider: LinkProvider;
  created_at: string;
  updated_at: string;
}
export interface LinkInput {
  title: string;
  url: string;
}
