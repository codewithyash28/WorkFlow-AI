/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId?: string;
  teamId?: string;
  title: string;
  description: string;
  priority: Priority;
  deadline?: string;
  estimatedTime?: number; // in minutes
  reminder?: string; // ISO string
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  completed: boolean;
  subtasks: SubTask[];
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'break' | 'personal';
}

export interface AppStats {
  summariesGenerated: number;
  emailsDrafted: number;
  tasksCompleted: number;
}

export interface UserProfile extends AppStats {
  uid: string;
  email: string;
  name?: string;
  workType?: string;
  teamId?: string;
  isDarkMode: boolean;
  tutorialShown: boolean;
}

export type AppView = 'tasks' | 'planner' | 'summarizer' | 'emails' | 'dashboard';
