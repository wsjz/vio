use serde::Serialize;
use std::net::IpAddr;
use std::process::Stdio;
use tokio::process::Command;

#[derive(Serialize, Clone)]
pub struct NetworkInterface {
    pub name: String,
    pub ip: Vec<String>,
    pub mac: Option<String>,
    pub is_up: bool,
}

#[derive(Serialize, Clone)]
pub struct NetworkNode {
    pub ip: String,
    pub hostname: Option<String>,
    pub latency_ms: Option<u64>,
    pub is_online: bool,
    pub mac: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct NetworkInfo {
    pub hostname: String,
    pub interfaces: Vec<NetworkInterface>,
    pub default_gateway: Option<String>,
}

#[tauri::command]
pub async fn get_network_info() -> Result<NetworkInfo, String> {
    let hostname = sysinfo::System::host_name().unwrap_or_else(|| "unknown".to_string());

    let mut interfaces = Vec::new();

    // Use ifconfig / ip command based on OS
    let cmd = if cfg!(target_os = "macos") {
        Command::new("ifconfig").output().await
    } else {
        Command::new("ip").args(["addr", "show"]).output().await
    };

    // Fallback: try to get basic info from hostname
    let hostname_ips = tokio::net::lookup_host(format!("{}:0", hostname))
        .await
        .ok()
        .map(|addrs| {
            addrs
                .filter_map(|a| match a.ip() {
                    IpAddr::V4(v4) => Some(v4.to_string()),
                    _ => None,
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    interfaces.push(NetworkInterface {
        name: "localhost".to_string(),
        ip: hostname_ips,
        mac: None,
        is_up: true,
    });

    // Parse ifconfig output on macOS
    if let Ok(output) = cmd {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut current_name = String::new();
        let mut current_ips = Vec::new();
        let mut current_mac = None;
        let mut current_up = false;

        for line in stdout.lines() {
            let trimmed = line.trim();

            // macOS ifconfig: interface name starts line
            if cfg!(target_os = "macos") && !trimmed.starts_with('\t') && trimmed.contains(':') {
                if !current_name.is_empty() {
                    interfaces.push(NetworkInterface {
                        name: current_name.clone(),
                        ip: current_ips.clone(),
                        mac: current_mac.clone(),
                        is_up: current_up,
                    });
                }
                current_name = trimmed.split(':').next().unwrap_or("").to_string();
                current_ips.clear();
                current_mac = None;
                current_up = trimmed.contains("UP");
            }

            // macOS inet
            if cfg!(target_os = "macos") && trimmed.starts_with("inet ") && !trimmed.starts_with("inet6") {
                if let Some(ip) = trimmed.split_whitespace().nth(1) {
                    current_ips.push(ip.to_string());
                }
            }

            // macOS ether
            if cfg!(target_os = "macos") && trimmed.starts_with("ether ") {
                if let Some(mac) = trimmed.split_whitespace().nth(1) {
                    current_mac = Some(mac.to_string());
                }
            }
        }

        if !current_name.is_empty() {
            interfaces.push(NetworkInterface {
                name: current_name,
                ip: current_ips,
                mac: current_mac,
                is_up: current_up,
            });
        }
    }

    // Get default gateway
    let gateway_cmd = if cfg!(target_os = "macos") {
        Command::new("netstat").args(["-rn"]).output().await
    } else {
        Command::new("ip").args(["route"]).output().await
    };

    let mut default_gateway = None;
    if let Ok(output) = gateway_cmd {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("default") {
                let parts: Vec<_> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    default_gateway = Some(parts[2].to_string());
                    break;
                }
            }
        }
    }

    // Remove localhost duplicate if it has no real IPs
    interfaces.retain(|i| !(i.name == "localhost" && i.ip.is_empty()));

    Ok(NetworkInfo {
        hostname,
        interfaces,
        default_gateway,
    })
}

#[tauri::command]
pub async fn scan_network(subnet: String) -> Result<Vec<NetworkNode>, String> {
    let mut nodes = Vec::new();

    // Parse subnet like "192.168.1"
    let base = subnet.trim_end_matches('.');

    // Scan .1 - .20 (limited for speed)
    let mut tasks = Vec::new();
    for i in 1..=20 {
        let ip = format!("{}.{}", base, i);
        let task = tokio::spawn(async move {
            let result = if cfg!(target_os = "windows") {
                Command::new("ping")
                    .args(["-n", "1", "-w", "500", &ip])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status()
                    .await
            } else {
                Command::new("ping")
                    .args(["-c", "1", "-W", "1", &ip])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status()
                    .await
            };

            match result {
                Ok(status) if status.success() => Some(NetworkNode {
                    ip: ip.clone(),
                    hostname: None,
                    latency_ms: Some(1),
                    is_online: true,
                    mac: None,
                }),
                _ => None,
            }
        });
        tasks.push(task);
    }

    for task in tasks {
        if let Ok(Some(node)) = task.await {
            nodes.push(node);
        }
    }

    // Add gateway as center node
    nodes.push(NetworkNode {
        ip: format!("{}.{}", base, 1),
        hostname: Some("Gateway".to_string()),
        latency_ms: Some(0),
        is_online: true,
        mac: None,
    });

    Ok(nodes)
}
