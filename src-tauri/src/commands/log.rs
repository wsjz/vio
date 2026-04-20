use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::process::Command;

#[derive(Deserialize)]
pub struct LogQueryOptions {
    pub source: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Serialize, Clone)]
pub struct SystemLogEntry {
    pub timestamp: String,
    pub level: String,
    pub source: String,
    pub message: String,
}

#[tauri::command]
pub async fn get_system_logs(options: LogQueryOptions) -> Result<Vec<SystemLogEntry>, String> {
    let limit = options.limit.unwrap_or(200);
    let source = options.source.as_deref().unwrap_or("system");

    let output = if cfg!(target_os = "macos") {
        // macOS: use log command for system logs
        if source == "kernel" {
            Command::new("log")
                .args(["show", "--last", "1h", "--predicate", "sender == 'kernel'", "--style", "compact"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await
        } else {
            Command::new("log")
                .args(["show", "--last", "30m", "--style", "compact"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await
        }
    } else if cfg!(target_os = "linux") {
        // Linux: journalctl or /var/log/syslog
        Command::new("journalctl")
            .args(["-n", &limit.to_string(), "--no-pager", "-o", "short-iso"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
    } else {
        // Windows: wevtutil
        Command::new("wevtutil")
            .args(["qe", "System", "/c:&limit.to_string()", "/f:text"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
    };

    let output = output.map_err(|e| format!("Failed to read logs: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut logs = Vec::new();

    if cfg!(target_os = "macos") {
        for line in stdout.lines().rev().take(limit) {
            if let Some(entry) = parse_macos_log_line(line) {
                logs.push(entry);
            }
        }
    } else if cfg!(target_os = "linux") {
        for line in stdout.lines().rev().take(limit) {
            if let Some(entry) = parse_linux_log_line(line) {
                logs.push(entry);
            }
        }
    } else {
        for line in stdout.lines().rev().take(limit) {
            if let Some(entry) = parse_windows_log_line(line) {
                logs.push(entry);
            }
        }
    }

    // Reverse back to chronological order
    logs.reverse();

    // Fallback if no logs parsed
    if logs.is_empty() {
        logs.push(SystemLogEntry {
            timestamp: chrono::Local::now().to_rfc3339(),
            level: "INFO".to_string(),
            source: "vio".to_string(),
            message: "No system logs available or log access denied.".to_string(),
        });
    }

    Ok(logs)
}

fn parse_macos_log_line(line: &str) -> Option<SystemLogEntry> {
    // Compact format: "2024-01-20 10:23:45.123456+0800  process[pid]: message"
    let parts: Vec<&str> = line.splitn(3, ' ').collect();
    if parts.len() < 3 {
        return None;
    }

    let timestamp = format!("{}T{}", parts[0], parts[1]);
    let rest = parts[2];

    // Try to extract process name and message
    let (source, message) = if let Some(idx) = rest.find(':') {
        (rest[..idx].trim(), rest[idx + 1..].trim())
    } else {
        ("system", rest)
    };

    // Clean up source - remove [pid]
    let source = source.split('[').next().unwrap_or(source).to_string();

    // Guess level from message content
    let level = guess_level(message);

    Some(SystemLogEntry {
        timestamp,
        level,
        source,
        message: message.to_string(),
    })
}

fn parse_linux_log_line(line: &str) -> Option<SystemLogEntry> {
    // ISO format: "2024-01-20T10:23:45+0800 hostname process: message"
    let parts: Vec<&str> = line.splitn(4, ' ').collect();
    if parts.len() < 4 {
        return None;
    }

    let timestamp = parts[0].to_string();
    let source = parts[2].trim_end_matches(':').to_string();
    let message = parts[3].to_string();
    let level = guess_level(&message);

    Some(SystemLogEntry {
        timestamp,
        level,
        source,
        message,
    })
}

fn parse_windows_log_line(line: &str) -> Option<SystemLogEntry> {
    // Simple fallback
    Some(SystemLogEntry {
        timestamp: chrono::Local::now().to_rfc3339(),
        level: "INFO".to_string(),
        source: "windows".to_string(),
        message: line.to_string(),
    })
}

fn guess_level(message: &str) -> String {
    let msg = message.to_lowercase();
    if msg.contains("fatal") || msg.contains("panic") || msg.contains("critical") {
        "FATAL".to_string()
    } else if msg.contains("error") || msg.contains("fail") || msg.contains("denied") {
        "ERROR".to_string()
    } else if msg.contains("warn") || msg.contains("deprecated") || msg.contains("timeout") {
        "WARN".to_string()
    } else if msg.contains("debug") || msg.contains("trace") {
        "DEBUG".to_string()
    } else {
        "INFO".to_string()
    }
}
