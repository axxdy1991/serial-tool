use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serialport::{DataBits, Parity, SerialPort, StopBits};
use tauri::State;

type SerialPortMap = Arc<Mutex<HashMap<String, Box<dyn SerialPort>>>>;

#[tauri::command]
fn get_available_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => {
            let port_names: Vec<String> = ports.iter().map(|p| p.port_name.clone()).collect();
            Ok(port_names)
        }
        Err(e) => Err(format!("Failed to get serial ports: {}", e)),
    }
}

#[tauri::command]
fn open_serial_port(
    port_map: State<'_, SerialPortMap>,
    port_name: String,
    baud_rate: u32,
    data_bits: u8,
    stop_bits: u8,
    parity: String,
) -> Result<(), String> {
    let data_bits_enum = match data_bits {
        5 => DataBits::Five,
        6 => DataBits::Six,
        7 => DataBits::Seven,
        8 => DataBits::Eight,
        _ => return Err("Invalid data bits".to_string()),
    };

    let stop_bits_enum = match stop_bits {
        1 => StopBits::One,
        2 => StopBits::Two,
        _ => return Err("Invalid stop bits".to_string()),
    };

    let parity_enum = match parity.as_str() {
        "none" => Parity::None,
        "odd" => Parity::Odd,
        "even" => Parity::Even,
        _ => return Err("Invalid parity".to_string()),
    };

    let port = serialport::new(&port_name, baud_rate)
        .data_bits(data_bits_enum)
        .stop_bits(stop_bits_enum)
        .parity(parity_enum)
        .timeout(std::time::Duration::from_millis(10))
        .open()
        .map_err(|e| format!("Failed to open port: {}", e))?;

    let mut map = port_map.lock().unwrap();
    map.insert(port_name.clone(), port);

    Ok(())
}

#[tauri::command]
fn close_serial_port(
    port_map: State<'_, SerialPortMap>,
    port_name: String,
) -> Result<(), String> {
    let mut map = port_map.lock().unwrap();
    if map.remove(&port_name).is_some() {
        Ok(())
    } else {
        Err("Port not found".to_string())
    }
}

#[tauri::command]
fn write_serial_data(
    port_map: State<'_, SerialPortMap>,
    port_name: String,
    data: Vec<u8>,
) -> Result<usize, String> {
    let mut map = port_map.lock().unwrap();
    if let Some(port) = map.get_mut(&port_name) {
        port.write(&data)
            .map_err(|e| format!("Failed to write data: {}", e))
    } else {
        Err("Port not open".to_string())
    }
}

#[tauri::command]
fn read_serial_data(
    port_map: State<'_, SerialPortMap>,
    port_name: String,
) -> Result<Vec<u8>, String> {
    let mut map = port_map.lock().unwrap();
    if let Some(port) = map.get_mut(&port_name) {
        let mut buffer = vec![0; 4096];
        match port.read(&mut buffer) {
            Ok(bytes_read) => {
                buffer.truncate(bytes_read);
                Ok(buffer)
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => Ok(vec![]),
            Err(e) => Err(format!("Failed to read data: {}", e)),
        }
    } else {
        Err("Port not open".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port_map: SerialPortMap = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(port_map)
        .invoke_handler(tauri::generate_handler![
            get_available_ports,
            open_serial_port,
            close_serial_port,
            write_serial_data,
            read_serial_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(mobile))]
fn main() {
    run();
}
