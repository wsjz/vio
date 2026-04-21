mod commands;

use commands::system::{SystemState, get_system_info, get_system_metrics, get_processes};
use commands::shell::{execute_command, execute_shell};
use commands::fs::{list_directory, read_file, get_home_directory, write_file};
use commands::network::{get_network_info, scan_network};
use commands::log::get_system_logs;
use commands::layout::{save_layout, load_layout, list_layouts, delete_layout, export_layout, import_layout, get_layouts_directory};
use std::sync::Mutex;
use sysinfo::System;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(SystemState {
      system: Mutex::new(System::new_all()),
      disks: Mutex::new(sysinfo::Disks::new_with_refreshed_list()),
    })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_system_info,
      get_system_metrics,
      get_processes,
      execute_command,
      execute_shell,
      list_directory,
      read_file,
      get_home_directory,
      write_file,
      get_network_info,
      scan_network,
      get_system_logs,
      save_layout,
      load_layout,
      list_layouts,
      delete_layout,
      export_layout,
      import_layout,
      get_layouts_directory,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
