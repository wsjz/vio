use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LayoutVector2D {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LayoutSize2D {
    pub width: f64,
    pub height: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LayoutWindow {
    pub window_type: String,
    pub position: LayoutVector2D,
    pub size: LayoutSize2D,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LayoutData {
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub windows: Vec<LayoutWindow>,
}

#[derive(Serialize, Clone)]
pub struct LayoutSummary {
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub window_count: usize,
}

fn layouts_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let dir = home.join(".vio").join("layouts");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create layouts dir: {}", e))?;
    }
    Ok(dir)
}

fn layout_path(name: &str) -> Result<PathBuf, String> {
    let dir = layouts_dir()?;
    // Sanitize name: only allow alphanumeric, hyphen, underscore
    let sanitized: String = name
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if sanitized.is_empty() {
        return Err("Invalid layout name".to_string());
    }
    Ok(dir.join(format!("{}.json", sanitized)))
}

#[tauri::command]
pub fn save_layout(
    name: String,
    description: String,
    windows: Vec<LayoutWindow>,
) -> Result<(), String> {
    let path = layout_path(&name)?;
    let data = LayoutData {
        name: name.clone(),
        description,
        created_at: chrono::Local::now().to_rfc3339(),
        windows,
    };
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("Failed to write layout: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn load_layout(name: String) -> Result<LayoutData, String> {
    let path = layout_path(&name)?;
    let json = fs::read_to_string(&path).map_err(|e| format!("Layout not found: {}", e))?;
    let data: LayoutData = serde_json::from_str(&json).map_err(|e| format!("Invalid layout file: {}", e))?;
    Ok(data)
}

#[tauri::command]
pub fn list_layouts() -> Result<Vec<LayoutSummary>, String> {
    let dir = layouts_dir()?;
    let mut layouts = Vec::new();

    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read layouts dir: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Ok(json) = fs::read_to_string(&path) {
                if let Ok(data) = serde_json::from_str::<LayoutData>(&json) {
                    layouts.push(LayoutSummary {
                        name: data.name,
                        description: data.description,
                        created_at: data.created_at,
                        window_count: data.windows.len(),
                    });
                }
            }
        }
    }

    layouts.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(layouts)
}

#[tauri::command]
pub fn delete_layout(name: String) -> Result<(), String> {
    let path = layout_path(&name)?;
    fs::remove_file(&path).map_err(|e| format!("Failed to delete layout: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn export_layout(name: String, file_path: String) -> Result<(), String> {
    let src = layout_path(&name)?;
    let dst = PathBuf::from(&file_path);
    fs::copy(&src, &dst).map_err(|e| format!("Failed to export layout: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn import_layout(file_path: String) -> Result<LayoutSummary, String> {
    let src = PathBuf::from(&file_path);
    let json = fs::read_to_string(&src).map_err(|e| format!("Failed to read file: {}", e))?;
    let data: LayoutData = serde_json::from_str(&json).map_err(|e| format!("Invalid layout file: {}", e))?;

    let dest = layout_path(&data.name)?;
    fs::write(&dest, json).map_err(|e| format!("Failed to save imported layout: {}", e))?;

    Ok(LayoutSummary {
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        window_count: data.windows.len(),
    })
}

#[tauri::command]
pub fn get_layouts_directory() -> Result<String, String> {
    let dir = layouts_dir()?;
    Ok(dir.to_string_lossy().to_string())
}
