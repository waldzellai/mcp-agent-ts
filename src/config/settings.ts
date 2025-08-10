import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';

export interface MCPServerAuthSettings {
  api_key?: string;
  [key: string]: unknown;
}

export interface MCPRootSettings {
  uri: string;
  name?: string;
  server_uri_alias?: string;
  [key: string]: unknown;
}

export type MCPTransport = 'stdio' | 'sse' | 'streamable_http' | 'websocket';

export interface MCPServerSettings {
  name?: string;
  description?: string;
  transport?: MCPTransport;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  http_timeout_seconds?: number;
  read_timeout_seconds?: number;
  terminate_on_close?: boolean;
  auth?: MCPServerAuthSettings;
  roots?: MCPRootSettings[];
  env?: Record<string, string>;
  [key: string]: unknown;
}

export interface MCPSettings {
  servers?: Record<string, MCPServerSettings>;
  [key: string]: unknown;
}

export interface Settings {
  mcp?: MCPSettings;
  execution_engine?: 'asyncio' | 'temporal';
  [key: string]: unknown;
}

const CONFIG_FILENAMES = ['mcp-agent.config.yaml', 'mcp_agent.config.yaml'];
const SECRETS_FILENAMES = ['mcp-agent.secrets.yaml', 'mcp_agent.secrets.yaml'];

function findUp(filenames: string[]): string | null {
  let dir = process.cwd();
  // Walk up until root
  while (true) {
    for (const name of filenames) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

function deepMerge(base: any, update: any): any {
  if (update == null || typeof update !== 'object') {
    return base;
  }
  const result: any = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(update)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

let cachedSettings: Settings | null = null;

export function loadSettings(configPath?: string): Settings {
  let merged: any = {};
  const configFile = configPath ?? findUp(CONFIG_FILENAMES);

  if (configFile && fs.existsSync(configFile)) {
    const configData = parse(fs.readFileSync(configFile, 'utf8')) || {};
    merged = deepMerge(merged, configData);

    const configDir = path.dirname(configFile);
    let secretsFile: string | null = null;
    for (const name of SECRETS_FILENAMES) {
      const candidate = path.join(configDir, name);
      if (fs.existsSync(candidate)) {
        secretsFile = candidate;
        break;
      }
    }
    if (!secretsFile) {
      secretsFile = findUp(SECRETS_FILENAMES);
    }
    if (secretsFile && fs.existsSync(secretsFile)) {
      const secretsData = parse(fs.readFileSync(secretsFile, 'utf8')) || {};
      merged = deepMerge(merged, secretsData);
    }
  }

  return merged as Settings;
}

export function getSettings(configPath?: string): Settings {
  if (!cachedSettings) {
    cachedSettings = loadSettings(configPath);
  }
  return cachedSettings;
}

export function clearSettingsCache(): void {
  cachedSettings = null;
}

export function findConfig(): string | null {
  return findUp(CONFIG_FILENAMES);
}

export function findSecrets(): string | null {
  return findUp(SECRETS_FILENAMES);
}
