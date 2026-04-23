use serde::Serialize;
use std::process::Stdio;
use tokio::process::Command;

#[derive(Serialize)]
pub struct ShellResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[tauri::command]
pub async fn execute_command(cmd: String, args: Option<Vec<String>>) -> Result<ShellResult, String> {
    let args = args.unwrap_or_default();

    let output = Command::new(&cmd)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    Ok(ShellResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

#[tauri::command]
pub async fn execute_shell(command: String) -> Result<ShellResult, String> {
    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let arg = if cfg!(target_os = "windows") { "/C" } else { "-c" };

    let command = command.trim();
    if command.is_empty() {
        return Err("Empty command".to_string());
    }

    // Basic safety check: block obviously dangerous patterns
    let lower = command.to_lowercase();
    let dangerous_patterns = [
        "rm -rf /", "rm -rf /*", "mkfs.", "dd if=/dev/zero of=/dev",
        ":(){:|:&};:", "> /dev/sda", "> /dev/hda",
        "curl .*| sh", "curl .*| bash", "wget .*| sh", "wget .*| bash",
    ];
    for pattern in &dangerous_patterns {
        if lower.contains(pattern) {
            return Err(format!("Dangerous command blocked: {}", pattern));
        }
    }

    let output = Command::new(shell)
        .arg(arg)
        .arg(command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute shell command: {}", e))?;

    Ok(ShellResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}
