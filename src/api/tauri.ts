import { invoke } from '@tauri-apps/api/core';

// ===== System Monitor =====
export interface SystemMetrics {
  cpu_usage: number;
  memory_used: number;
  memory_total: number;
  memory_usage_percent: number;
  disk_used: number;
  disk_total: number;
  disk_usage_percent: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_mb: number;
  status: string;
}

export interface SystemInfo {
  hostname: string;
  os_name: string;
  os_version: string;
  kernel_version: string;
  cpu_count: number;
  cpu_brand: string;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke('get_system_info');
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  return invoke('get_system_metrics');
}

export async function getProcesses(): Promise<ProcessInfo[]> {
  return invoke('get_processes');
}

// ===== Shell =====
export interface ShellResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

export async function executeCommand(cmd: string, args?: string[]): Promise<ShellResult> {
  return invoke('execute_command', { cmd, args: args ?? [] });
}

export async function executeShell(command: string): Promise<ShellResult> {
  return invoke('execute_shell', { command });
}

// ===== File Manager =====
export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_file: boolean;
  size: number;
  modified: string | null;
}

export interface DirectoryListing {
  path: string;
  entries: FileEntry[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

export async function listDirectory(dirPath: string): Promise<DirectoryListing> {
  return invoke('list_directory', { dirPath });
}

export async function readFile(filePath: string): Promise<FileContent> {
  return invoke('read_file', { filePath });
}

export async function getHomeDirectory(): Promise<string> {
  return invoke('get_home_directory');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  return invoke('write_file', { filePath, content });
}

// ===== Network =====
export interface NetworkInterface {
  name: string;
  ip: string[];
  mac: string | null;
  is_up: boolean;
}

export interface NetworkNode {
  ip: string;
  hostname: string | null;
  latency_ms: number | null;
  is_online: boolean;
  mac: string | null;
}

export interface NetworkInfo {
  hostname: string;
  interfaces: NetworkInterface[];
  default_gateway: string | null;
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  return invoke('get_network_info');
}

export async function scanNetwork(subnet: string): Promise<NetworkNode[]> {
  return invoke('scan_network', { subnet });
}

// ===== Log Viewer =====
export interface SystemLogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

export interface LogQueryOptions {
  source?: 'system' | 'kernel';
  limit?: number;
}

export async function getSystemLogs(options: LogQueryOptions = {}): Promise<SystemLogEntry[]> {
  return invoke('get_system_logs', { options });
}

// ===== Layout Manager =====
export interface LayoutWindow {
  window_type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface LayoutData {
  name: string;
  description: string;
  created_at: string;
  windows: LayoutWindow[];
}

export interface LayoutSummary {
  name: string;
  description: string;
  created_at: string;
  window_count: number;
}

export async function saveLayout(name: string, description: string, windows: LayoutWindow[]): Promise<void> {
  return invoke('save_layout', { name, description, windows });
}

export async function loadLayout(name: string): Promise<LayoutData> {
  return invoke('load_layout', { name });
}

export async function listLayouts(): Promise<LayoutSummary[]> {
  return invoke('list_layouts');
}

export async function deleteLayout(name: string): Promise<void> {
  return invoke('delete_layout', { name });
}

export async function exportLayout(name: string, filePath: string): Promise<void> {
  return invoke('export_layout', { name, filePath });
}

export async function importLayout(filePath: string): Promise<LayoutSummary> {
  return invoke('import_layout', { filePath });
}

export async function getLayoutsDirectory(): Promise<string> {
  return invoke('get_layouts_directory');
}
