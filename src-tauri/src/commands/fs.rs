use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    pub size: u64,
    pub modified: Option<String>,
}

#[derive(Serialize)]
pub struct DirectoryListing {
    pub path: String,
    pub entries: Vec<FileEntry>,
}

#[derive(Serialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub size: u64,
}

#[tauri::command]
pub fn list_directory(dir_path: String) -> Result<DirectoryListing, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", dir_path));
    }
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", dir_path));
    }

    let mut entries = Vec::new();

    match std::fs::read_dir(path) {
        Ok(read_dir) => {
            for entry in read_dir {
                if let Ok(entry) = entry {
                    let metadata = entry.metadata().ok();
                    let name = entry.file_name().to_string_lossy().to_string();
                    let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
                    let is_file = metadata.as_ref().map(|m| m.is_file()).unwrap_or(false);
                    let size = metadata.as_ref().map(|m| if m.is_file() { m.len() } else { 0 }).unwrap_or(0);
                    let modified = metadata
                        .as_ref()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| {
                            t.duration_since(std::time::UNIX_EPOCH)
                                .ok()
                                .map(|d| d.as_secs() as i64)
                        })
                        .map(|ts| {
                            chrono::DateTime::from_timestamp(ts, 0)
                                .map(|dt| dt.format("%Y-%m-%d %H:%M").to_string())
                                .unwrap_or_default()
                        });

                    let full_path = entry.path().to_string_lossy().to_string();
                    entries.push(FileEntry {
                        name,
                        path: full_path,
                        is_dir,
                        is_file,
                        size,
                        modified,
                    });
                }
            }
        }
        Err(e) => return Err(format!("Failed to read directory: {}", e)),
    }

    entries.sort_by(|a, b| {
        if a.is_dir && !b.is_dir {
            std::cmp::Ordering::Less
        } else if !a.is_dir && b.is_dir {
            std::cmp::Ordering::Greater
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(DirectoryListing {
        path: dir_path,
        entries,
    })
}

#[tauri::command]
pub fn read_file(file_path: String) -> Result<FileContent, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    if !path.is_file() {
        return Err(format!("Not a file: {}", file_path));
    }

    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
    let size = metadata.len();

    // Only read text files up to 1MB
    if size > 1_048_576 {
        return Err("File too large (>1MB)".to_string());
    }

    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;

    Ok(FileContent {
        path: file_path,
        content,
        size,
    })
}

#[tauri::command]
pub fn get_home_directory() -> String {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "/".to_string())
}

#[tauri::command]
pub fn write_file(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content).map_err(|e| e.to_string())
}
