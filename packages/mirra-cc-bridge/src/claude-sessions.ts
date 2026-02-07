/**
 * Claude Code Session Discovery
 *
 * Scans the Claude Code data directory to find resumable sessions.
 * Sessions are stored in ~/.claude/projects/{encoded-path}/sessions-index.json
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CLAUDE_DIR = join(homedir(), '.claude');
const PROJECTS_DIR = join(CLAUDE_DIR, 'projects');

/**
 * A single session entry from Claude Code's sessions-index.json
 */
export interface ClaudeCodeSessionEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch?: string;
  projectPath: string;
  isSidechain?: boolean;
}

/**
 * Session entry formatted for the mobile app
 */
export interface ClaudeCodeSessionResponse {
  id: string;
  summary: string;
  firstPrompt: string;
  messageCount: number;
  projectPath: string;
  projectName: string;  // Extracted from projectPath for display
  gitBranch?: string;
  createdAt: string;
  modifiedAt: string;
}

/**
 * Options for listing sessions
 */
export interface ListSessionsOptions {
  /** Maximum number of sessions to return (default: 20) */
  limit?: number;
  /** Filter to sessions from a specific project path */
  projectPath?: string;
  /** Search term to filter sessions by summary or first prompt */
  search?: string;
}

/**
 * Decode a project directory name back to the original path
 * Claude Code encodes paths by replacing / and : with -
 */
function decodeProjectDirName(dirName: string): string {
  // The encoding replaces path separators with -
  // e.g., "-Users-tone-Desktop-project" -> "/Users/tone/Desktop/project"
  if (dirName.startsWith('-')) {
    return dirName.replace(/-/g, '/');
  }
  return dirName;
}

/**
 * Extract the project name from a full project path
 */
function extractProjectName(projectPath: string): string {
  const parts = projectPath.split('/').filter(Boolean);
  return parts[parts.length - 1] || projectPath;
}

/**
 * List all resumable Claude Code sessions across all projects
 */
export function listClaudeCodeSessions(options: ListSessionsOptions = {}): ClaudeCodeSessionResponse[] {
  const { limit = 20, projectPath, search } = options;
  const sessions: ClaudeCodeSessionResponse[] = [];

  // Check if Claude Code projects directory exists
  if (!existsSync(PROJECTS_DIR)) {
    return sessions;
  }

  try {
    const projectDirs = readdirSync(PROJECTS_DIR);

    for (const projectDir of projectDirs) {
      // Skip hidden files and non-directories
      if (projectDir.startsWith('.')) continue;

      const projectFullPath = join(PROJECTS_DIR, projectDir);
      const stat = statSync(projectFullPath);
      if (!stat.isDirectory()) continue;

      const sessionsIndexPath = join(projectFullPath, 'sessions-index.json');
      if (!existsSync(sessionsIndexPath)) continue;

      try {
        const indexContent = readFileSync(sessionsIndexPath, 'utf-8');
        const index = JSON.parse(indexContent);

        if (!index.entries || !Array.isArray(index.entries)) continue;

        for (const entry of index.entries as ClaudeCodeSessionEntry[]) {
          // Skip sidechains (these are typically internal)
          if (entry.isSidechain) continue;

          // Apply project path filter if specified
          if (projectPath && entry.projectPath !== projectPath) continue;

          // Apply search filter if specified
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesSummary = entry.summary?.toLowerCase().includes(searchLower);
            const matchesPrompt = entry.firstPrompt?.toLowerCase().includes(searchLower);
            if (!matchesSummary && !matchesPrompt) continue;
          }

          sessions.push({
            id: entry.sessionId,
            summary: entry.summary || 'Untitled Session',
            firstPrompt: entry.firstPrompt || '',
            messageCount: entry.messageCount || 0,
            projectPath: entry.projectPath,
            projectName: extractProjectName(entry.projectPath),
            gitBranch: entry.gitBranch,
            createdAt: entry.created,
            modifiedAt: entry.modified,
          });
        }
      } catch (err) {
        // Skip projects with invalid index files
        continue;
      }
    }

    // Sort by modified date (most recent first)
    sessions.sort((a, b) => {
      const dateA = new Date(a.modifiedAt).getTime();
      const dateB = new Date(b.modifiedAt).getTime();
      return dateB - dateA;
    });

    // Apply limit
    return sessions.slice(0, limit);
  } catch (err) {
    console.error('Error listing Claude Code sessions:', err);
    return [];
  }
}

/**
 * Get the distinct project paths that have Claude Code sessions
 */
export function listClaudeCodeProjects(): string[] {
  const projects = new Set<string>();

  if (!existsSync(PROJECTS_DIR)) {
    return [];
  }

  try {
    const projectDirs = readdirSync(PROJECTS_DIR);

    for (const projectDir of projectDirs) {
      if (projectDir.startsWith('.')) continue;

      const projectFullPath = join(PROJECTS_DIR, projectDir);
      const stat = statSync(projectFullPath);
      if (!stat.isDirectory()) continue;

      const sessionsIndexPath = join(projectFullPath, 'sessions-index.json');
      if (!existsSync(sessionsIndexPath)) continue;

      try {
        const indexContent = readFileSync(sessionsIndexPath, 'utf-8');
        const index = JSON.parse(indexContent);

        // Get the original path from the index if available
        if (index.originalPath) {
          projects.add(index.originalPath);
        } else if (index.entries?.length > 0) {
          // Fall back to the projectPath from the first entry
          projects.add(index.entries[0].projectPath);
        }
      } catch {
        continue;
      }
    }

    return Array.from(projects).sort();
  } catch (err) {
    console.error('Error listing Claude Code projects:', err);
    return [];
  }
}
