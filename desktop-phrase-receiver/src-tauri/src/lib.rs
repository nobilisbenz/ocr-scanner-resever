use tauri::{AppHandle, Emitter, Manager};
use axum::{routing::post, Router, Json, extract::State};
use serde::{Deserialize, Serialize};
use local_ip_address::local_ip;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Deserialize, Serialize, Clone)]
struct PhrasePayload {
    text: String,
}

#[derive(Clone)]
struct AppState {
    app: AppHandle,
}

#[tauri::command]
fn get_local_ip() -> String {
    local_ip().map(|ip| ip.to_string()).unwrap_or_else(|_| "Unknown".to_string())
}

async fn receive_phrase(
    State(state): State<AppState>,
    Json(payload): Json<PhrasePayload>,
) {
    println!("Received phrase: {}", payload.text);
    let _ = state.app.emit("phrase-received", payload.text);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![get_local_ip])
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = AppState { app: app_handle };
                let app = Router::new()
                    .route("/phrase", post(receive_phrase))
                    .layer(CorsLayer::permissive())
                    .with_state(state);

                let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
                println!("Listening on {}", addr);
                // We unwrap here for simplicity, but in prod we should handle error
                if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
                     let _ = axum::serve(listener, app).await;
                } else {
                    eprintln!("Failed to bind to port 3000");
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
