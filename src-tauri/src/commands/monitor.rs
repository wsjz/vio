use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct MonitorInfo {
    pub id: String,
    pub bounds: Rect,
    pub dpi: f64,
    pub is_primary: bool,
}

#[derive(Serialize, Clone)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub fn get_monitors(window: tauri::Window) -> Result<Vec<MonitorInfo>, String> {
    let primary = window
        .primary_monitor()
        .map_err(|e| e.to_string())?;

    let primary_name: Option<String> = primary.as_ref()
        .and_then(|m| m.name().cloned());

    let monitors = window
        .available_monitors()
        .map_err(|e| e.to_string())?;

    let result: Vec<MonitorInfo> = monitors
        .iter()
        .map(|m| {
            let pos = m.position();
            let size = m.size();
            let scale = m.scale_factor();
            let name = m.name().cloned().unwrap_or_else(|| format!("monitor-{}", m.position().x));

            // Convert physical pixels to logical pixels (CSS pixels)
            // Frontend uses CSS pixels for layout (window.innerWidth, e.clientX, etc.)
            let logical_x = (pos.x as f64 / scale).round() as i32;
            let logical_y = (pos.y as f64 / scale).round() as i32;
            let logical_w = (size.width as f64 / scale).round() as u32;
            let logical_h = (size.height as f64 / scale).round() as u32;

            MonitorInfo {
                id: name.clone(),
                bounds: Rect {
                    x: logical_x,
                    y: logical_y,
                    width: logical_w,
                    height: logical_h,
                },
                dpi: scale,
                is_primary: Some(name) == primary_name,
            }
        })
        .collect();

    Ok(result)
}
