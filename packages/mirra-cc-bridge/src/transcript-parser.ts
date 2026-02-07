/**
 * Transcript Parser - shared logic for parsing Claude Code transcripts
 *
 * Used by both hook.ts (for final execution card) and session-manager.ts (for progress updates)
 */

import { StructuredData, StructuredCardStep, StructuredCardBadge } from './types';

/**
 * Content block types in Claude's responses
 */
interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string | Array<{ type: string; text?: string }>;
  is_error?: boolean;
  thinking?: string;
}

/**
 * Transcript entry from Claude Code JSONL file
 */
interface TranscriptEntry {
  type?: string;
  message?: {
    role?: string;
    content?: string | ContentBlock[];
  };
  tool_name?: string;
  tool_result?: any;
  timestamp?: string;
}

/**
 * Result of parsing a transcript
 */
export interface TranscriptParseResult {
  steps: StructuredCardStep[];
  toolCounts: Record<string, number>;
  errors: Array<{ tool: string; message: string; timestamp?: string }>;
  hasThinking: boolean;
  thinkingSummary?: string;
}

/**
 * Get filename from path
 */
function getFileName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

/**
 * Truncate string to max length
 */
function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Generate a human-readable description for a tool use
 */
function generateToolDescription(toolName: string, input?: Record<string, any>): string {
  if (!input) return toolName;

  switch (toolName) {
    case 'Bash':
      return input.command ? `Run: ${truncateString(input.command, 60)}` : 'Run command';
    case 'Read':
      return input.file_path ? `Read: ${getFileName(input.file_path)}` : 'Read file';
    case 'Write':
      return input.file_path ? `Write: ${getFileName(input.file_path)}` : 'Write file';
    case 'Edit':
      return input.file_path ? `Edit: ${getFileName(input.file_path)}` : 'Edit file';
    case 'Glob':
      return input.pattern ? `Find: ${input.pattern}` : 'Find files';
    case 'Grep':
      return input.pattern ? `Search: ${truncateString(input.pattern, 40)}` : 'Search content';
    case 'Task':
      return input.description || 'Run agent task';
    case 'WebFetch':
      return input.url ? `Fetch: ${truncateString(input.url, 50)}` : 'Fetch URL';
    case 'WebSearch':
      return input.query ? `Search: ${truncateString(input.query, 40)}` : 'Web search';
    default:
      return toolName;
  }
}

/**
 * Format tool input for display in step detail
 */
function formatToolInput(toolName: string, input?: Record<string, any>): string | undefined {
  if (!input) return undefined;

  switch (toolName) {
    case 'Bash':
      return input.command;
    case 'Read':
    case 'Write':
    case 'Edit':
      return input.file_path;
    case 'Glob':
      return input.pattern;
    case 'Grep':
      return `${input.pattern}${input.path ? ` in ${input.path}` : ''}`;
    default:
      return undefined;
  }
}

/**
 * Truncate output for display (max 500 chars)
 */
function truncateOutput(output: any, maxLen: number = 500): string {
  if (output === undefined || output === null) return '';
  const str = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/**
 * Parse transcript content to extract tool steps and metadata
 */
export function parseTranscriptContent(content: string): TranscriptParseResult {
  const lines = content.trim().split('\n').filter(line => line.trim());

  const result: TranscriptParseResult = {
    steps: [],
    toolCounts: {},
    errors: [],
    hasThinking: false,
  };

  if (lines.length === 0) {
    return result;
  }

  // Parse all entries
  const entries: TranscriptEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // Skip unparseable lines
    }
  }

  if (entries.length === 0) {
    return result;
  }

  // Track tool uses and their results
  const toolUseMap = new Map<string, {
    toolName: string;
    input?: Record<string, any>;
    timestamp?: string;
  }>();

  let stepIndex = 0;

  // Process entries to extract tool uses and results
  for (const entry of entries) {
    if (!entry.message?.content || !Array.isArray(entry.message.content)) {
      continue;
    }

    for (const block of entry.message.content as ContentBlock[]) {
      // Track thinking blocks
      if (block.type === 'thinking' && block.thinking) {
        result.hasThinking = true;
        if (!result.thinkingSummary) {
          result.thinkingSummary = truncateString(block.thinking, 200);
        }
      }

      // Track tool_use blocks (assistant initiating tool calls)
      if (block.type === 'tool_use' && block.id && block.name) {
        toolUseMap.set(block.id, {
          toolName: block.name,
          input: block.input,
          timestamp: entry.timestamp,
        });

        // Count tool usage
        result.toolCounts[block.name] = (result.toolCounts[block.name] || 0) + 1;
      }

      // Track tool_result blocks (results of tool calls)
      if (block.type === 'tool_result' && block.tool_use_id) {
        const toolUse = toolUseMap.get(block.tool_use_id);
        if (toolUse) {
          const isError = block.is_error === true;
          const outputContent = typeof block.content === 'string'
            ? block.content
            : Array.isArray(block.content)
              ? block.content.map(c => c.text || '').join('\n')
              : '';

          // Interactive tools that don't work in headless mode should be marked as "skipped", not "error"
          const interactiveTools = ['AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode'];
          const isInteractiveTool = interactiveTools.includes(toolUse.toolName);
          const isSkipped = isError && isInteractiveTool;

          // Determine status
          // Note: We don't mark steps as 'error' because errors during Claude Code execution
          // are normal and self-correcting. Claude Code often retries failed operations.
          let status: 'success' | 'skipped' = 'success';
          let description: string | undefined;
          if (isSkipped) {
            status = 'skipped';
            description = 'Not available in remote mode';
          }
          // Errors are part of normal execution flow - no special status needed

          // Create step
          const step: StructuredCardStep = {
            id: `step-${stepIndex++}`,
            title: generateToolDescription(toolUse.toolName, toolUse.input),
            description,
            status,
            icon: toolUse.toolName.toLowerCase(),
            detail: formatToolInput(toolUse.toolName, toolUse.input),
            timestamp: toolUse.timestamp,
          };

          result.steps.push(step);

          // Only track real errors (not skipped interactive tools)
          if (isError && !isSkipped) {
            result.errors.push({
              tool: toolUse.toolName,
              message: truncateOutput(outputContent, 200),
              timestamp: toolUse.timestamp,
            });
          }
        }
      }
    }
  }

  return result;
}

/**
 * Parse transcript to build execution card data
 * Extracts tool_use blocks and matches them with tool_result blocks
 */
export async function parseTranscriptForExecutionCard(
  transcriptPath: string,
  sessionId: string,
  options?: {
    isProgress?: boolean;
    title?: string;
  }
): Promise<StructuredData | null> {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(transcriptPath, 'utf-8');

    const parseResult = parseTranscriptContent(content);

    // If no steps were found, don't create a card
    if (parseResult.steps.length === 0) {
      return null;
    }

    // Limit to 50 steps max
    const displaySteps = parseResult.steps.slice(0, 50);

    // Build badges
    const badges: StructuredCardBadge[] = [];

    // Add status badge - either "In Progress" or "Completed"
    if (options?.isProgress) {
      badges.push({
        label: 'In Progress',
        variant: 'warning',
      });
    } else {
      badges.push({
        label: 'Completed',
        variant: 'success',
      });
    }

    // Add step count badge
    badges.push({
      label: `${parseResult.steps.length} step${parseResult.steps.length !== 1 ? 's' : ''}`,
      variant: 'default',
    });

    // Add tool summary badge (top 2 tools)
    const sortedTools = Object.entries(parseResult.toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    if (sortedTools.length > 0) {
      badges.push({
        label: sortedTools.map(([name, count]) => `${name}: ${count}`).join(', '),
        variant: 'info',
      });
    }

    // Build summary stats
    const summary: Record<string, string | number> = {};
    for (const [tool, count] of Object.entries(parseResult.toolCounts)) {
      summary[tool] = count;
    }

    return {
      displayType: 'card',
      templateId: options?.isProgress ? 'progress_update' : 'execution_details',
      data: {
        title: options?.title || (options?.isProgress ? 'Progress Update' : 'Execution Details'),
        subtitle: parseResult.hasThinking ? 'With extended thinking' : undefined,
        badges,
        steps: displaySteps,
        summary,
        defaultExpanded: options?.isProgress ? true : false,
      },
      metadata: {
        sessionId,
        hasThinking: parseResult.hasThinking,
        thinkingSummary: parseResult.thinkingSummary,
        errorCount: parseResult.errors.length,
        totalSteps: parseResult.steps.length,
        isProgress: options?.isProgress,
      },
    };
  } catch (error) {
    // If we can't parse the transcript, return null
    return null;
  }
}
