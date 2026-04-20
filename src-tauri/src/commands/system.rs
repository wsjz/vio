use serde::Serialize;
use std::sync::Mutex;
use sysinfo::{ProcessStatus, ProcessesToUpdate, System};
use tauri::State;

#[derive(Serialize, Clone)]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub memory_used: u64,
    pub memory_total: u64,
    pub memory_usage_percent: f32,
    pub disk_used: u64,
    pub disk_total: u64,
    pub disk_usage_percent: f32,
}

#[derive(Serialize, Clone)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_mb: f64,
    pub status: String,
}

#[derive(Serialize, Clone)]
pub struct SystemInfo {
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub cpu_count: usize,
    pub cpu_brand: String,
}

pub struct SystemState(pub Mutex<System>);

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let sys = System::new_all();
    let cpu_brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    SystemInfo {
        hostname: System::host_name().unwrap_or_else(|| "unknown".to_string()),
        os_name: System::name().unwrap_or_else(|| "unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "unknown".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "unknown".to_string()),
        cpu_count: sys.physical_core_count().unwrap_or(0),
        cpu_brand,
    }
}

#[tauri::command]
pub fn get_system_metrics(state: State<'_, SystemState>) -> SystemMetrics {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu_usage = if !sys.cpus().is_empty() {
        sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>() / sys.cpus().len() as f32
    } else {
        0.0
    };
    let mem_total = sys.total_memory();
    let mem_used = sys.used_memory();
    let mem_percent = if mem_total > 0 {
        (mem_used as f32 / mem_total as f32) * 100.0
    } else {
        0.0
    };

    // Disk info
    let mut disk_total = 0u64;
    let mut disk_used = 0u64;
    let disks = sysinfo::Disks::new_with_refreshed_list();
    for disk in disks.iter() {
        if disk.mount_point() == std::path::Path::new("/") {
            disk_total = disk.total_space();
            disk_used = disk_total.saturating_sub(disk.available_space());
            break;
        }
    }
    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    SystemMetrics {
        cpu_usage: cpu_usage.min(100.0).max(0.0),
        memory_used: mem_used,
        memory_total: mem_total,
        memory_usage_percent: mem_percent.min(100.0).max(0.0),
        disk_used,
        disk_total,
        disk_usage_percent: disk_percent.min(100.0).max(0.0),
    }
}

#[tauri::command]
pub fn get_processes(state: State<'_, SystemState>) -> Vec<ProcessInfo> {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut procs: Vec<ProcessInfo> = sys
        .processes()
        .values()
        .map(|p| {
            let status_str = match p.status() {
                ProcessStatus::Run => "Running",
                ProcessStatus::Sleep => "Sleeping",
                ProcessStatus::Stop => "Stopped",
                ProcessStatus::Zombie => "Zombie",
                ProcessStatus::Dead => "Dead",
                ProcessStatus::Idle => "Idle",
                _ => "Unknown",
            };
            ProcessInfo {
                pid: p.pid().as_u32(),
                name: p.name().to_string_lossy().to_string(),
                cpu_usage: p.cpu_usage(),
                memory_mb: (p.memory() as f64) / 1024.0 / 1024.0,
                status: status_str.to_string(),
            }
        })
        .collect();

    procs.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    procs.truncate(20);
    procs
}
