use serde::{Deserialize, Serialize};
use std::io::BufRead;
use std::process::{Command, Stdio};
use std::sync::mpsc::{channel, RecvTimeoutError};
use std::time::Duration;

const LOG_TIMEOUT_SECS: u64 = 5;
const LOG_TIME_WINDOW: &str = "30s";

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

/// Run log command with strict timeout.
/// Uses synchronous std::process inside spawn_blocking for reliable process control.
#[tauri::command]
pub async fn get_system_logs(options: LogQueryOptions) -> Result<Vec<SystemLogEntry>, String> {
    let limit = options.limit.unwrap_or(100).min(500);
    let source = options.source.unwrap_or_else(|| "system".to_string());

    tokio::task::spawn_blocking(move || {
        run_log_command_sync(source, limit)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

fn run_log_command_sync(source: String, limit: usize) -> Result<Vec<SystemLogEntry>, String> {
    let mut cmd = if cfg!(target_os = "macos") {
        let mut c = Command::new("log");
        c.args(["show", "--last", LOG_TIME_WINDOW, "--style", "compact"]);
        if source == "kernel" {
            c.args(["--predicate", "sender == 'kernel'"]);
        }
        c
    } else if cfg!(target_os = "linux") {
        let mut c = Command::new("journalctl");
        c.args(["-n", "100", "--no-pager", "-o", "short-iso"]);
        c
    } else {
        let mut c = Command::new("wevtutil");
        c.args(["qe", "System", "/c:100", "/f:text"]);
        c
    };

    cmd.stdout(Stdio::piped()).stderr(Stdio::null());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn log command: {}", e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or("Failed to capture stdout")?;

    let (tx, rx) = channel();

    // Spawn reader thread to consume stdout
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stdout);
        let mut logs = Vec::new();
        for line in reader.lines().flatten() {
            if let Some(entry) = parse_macos_log_line(&line) {
                logs.push(entry);
                if logs.len() >= limit {
                    break;
                }
            }
        }
        let _ = tx.send(logs);
    });

    // Wait for reader to finish or timeout
    let mut logs = match rx.recv_timeout(Duration::from_secs(LOG_TIMEOUT_SECS)) {
        Ok(logs) => logs,
        Err(RecvTimeoutError::Timeout) => {
            let _ = child.kill();
            Vec::new()
        }
        Err(RecvTimeoutError::Disconnected) => Vec::new(),
    };

    // Ensure child is reaped
    let _ = child.wait();

    // Reverse back to chronological order
    logs.reverse();

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
    let parts: Vec<&str> = line.splitn(3, ' ').collect();
    if parts.len() < 3 {
        return None;
    }

    let timestamp = format!("{}T{}", parts[0], parts[1]);
    let rest = parts[2];

    let (source, message) = if let Some(idx) = rest.find(':') {
        (rest[..idx].trim(), rest[idx + 1..].trim())
    } else {
        ("system", rest)
    };

    let source = source.split('[').next().unwrap_or(source).to_string();
    let level = guess_level(message);

    Some(SystemLogEntry {
        timestamp,
        level,
        source,
        message: message.to_string(),
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
