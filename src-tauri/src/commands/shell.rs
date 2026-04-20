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

    let output = Command::new(shell)
        .arg(arg)
        .arg(&command)
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
