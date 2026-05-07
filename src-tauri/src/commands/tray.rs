// src-tauri/src/commands/tray.rs
// System tray and notification commands

use tauri::{AppHandle, Manager};

/// Show a native system notification
#[tauri::command]
pub fn show_notification(_app_handle: AppHandle, title: String, body: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "display notification \"{}\" with title \"{}\"",
                body.replace('"', "\\\""),
                title.replace('"', "\\\"")
            ))
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        // Windows notification via PowerShell
        let _ = std::process::Command::new("powershell")
            .arg("-Command")
            .arg(format!(
                "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('{}', '{}')",
                body.replace('"', "\\\""),
                title.replace('"', "\\\"")
            ))
            .output()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("notify-send")
            .arg(&title)
            .arg(&body)
            .output()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Set the window title (used to reflect status in taskbar)
#[tauri::command]
pub fn set_window_title(app_handle: AppHandle, title: String) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.set_title(&title).map_err(|e| e.to_string())?;
    }
    Ok(())
}
