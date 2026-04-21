use serde::{Serialize, Deserialize};
use std::process::Stdio;
use tokio::process::Command;

#[derive(Serialize, Deserialize, Debug)]
pub struct OpenCLIStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub npm_available: bool,
}

#[derive(Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub version: Option<String>,
}

/// Check if opencli is installed and get its version
#[tauri::command]
pub async fn check_opencli() -> Result<OpenCLIStatus, String> {
    // Check if npm is available
    let npm_check = Command::new("npm")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await;
    
    let npm_available = npm_check.is_ok() && npm_check.as_ref().unwrap().status.success();

    // Check if opencli is available
    let opencli_check = Command::new("opencli")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await;

    match opencli_check {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout)
                .trim()
                .to_string();
            
            // Try to find the full path
            let path_output = Command::new(if cfg!(target_os = "windows") { "where" } else { "which" })
                .arg("opencli")
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await;

            let path = path_output
                .ok()
                .filter(|o| o.status.success())
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());

            Ok(OpenCLIStatus {
                installed: true,
                version: Some(version),
                path,
                npm_available,
            })
        }
        _ => {
            // Try alternative: check if it's installed via npx
            let npx_check = Command::new("npx")
                .args(["@jackwener/opencli", "--version"])
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await;

            if let Ok(output) = npx_check {
                if output.status.success() {
                    let version = String::from_utf8_lossy(&output.stdout)
                        .trim()
                        .to_string();
                    
                    return Ok(OpenCLIStatus {
                        installed: true,
                        version: Some(version),
                        path: Some("npx @jackwener/opencli".to_string()),
                        npm_available,
                    });
                }
            }

            Ok(OpenCLIStatus {
                installed: false,
                version: None,
                path: None,
                npm_available,
            })
        }
    }
}

/// Install opencli globally via npm
#[tauri::command]
pub async fn install_opencli() -> Result<InstallResult, String> {
    // First check if npm is available
    let npm_check = Command::new("npm")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to check npm: {}", e))?;

    if !npm_check.status.success() {
        return Ok(InstallResult {
            success: false,
            message: "npm is not available. Please install Node.js first.".to_string(),
            version: None,
        });
    }

    // Install opencli globally
    let install_output = Command::new("npm")
        .args(["install", "-g", "@jackwener/opencli"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run npm install: {}", e))?;

    if install_output.status.success() {
        // Verify installation
        let version_output = Command::new("opencli")
            .arg("--version")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await;

        match version_output {
            Ok(output) if output.status.success() => {
                let version = String::from_utf8_lossy(&output.stdout)
                    .trim()
                    .to_string();
                Ok(InstallResult {
                    success: true,
                    message: "OpenCLI installed successfully".to_string(),
                    version: Some(version),
                })
            }
            _ => Ok(InstallResult {
                success: true,
                message: "Installation completed, but verification failed. You may need to restart Vio.".to_string(),
                version: None,
            }),
        }
    } else {
        let stderr = String::from_utf8_lossy(&install_output.stderr);
        Ok(InstallResult {
            success: false,
            message: format!("Installation failed: {}", stderr),
            version: None,
        })
    }
}

/// Open file dialog to select opencli binary path
#[tauri::command]
pub async fn pick_opencli_path(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let path = app_handle
        .dialog()
        .file()
        .set_title("Select OpenCLI Binary")
        .add_filter("Executable", &["", "exe"])
        .blocking_pick_file();

    match path {
        Some(file_path) => Ok(Some(file_path.to_string())),
        None => Ok(None),
    }
}
