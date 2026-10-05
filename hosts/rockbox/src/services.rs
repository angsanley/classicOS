//! Typed model services answered from Rockbox state. Field names follow the
//! PocketRock Host ABI 10 snapshots (framework/src/rockbox-*-model.ts); C
//! fills fixed-size structs so no allocation crosses the boundary.

use alloc::{string::String, vec, vec::Vec};
use core::{fmt::Write, slice};
use microts::{
    model::{Completion, Delivery, Value},
    pocketjs_core::spec::psm,
    NodeId, Ui,
};

pub const PLAYBACK: &str = "@pocketjs/framework/rockbox/playback/model";
pub const SYSTEM: &str = "@pocketjs/framework/rockbox/system/model";
pub const NAMES: [&str; 2] = [PLAYBACK, SYSTEM];

/// Mirrors `struct pocketjs_playback` on the C side.
#[repr(C)]
struct Playback {
    /// 0 stopped, 1 playing, 2 paused
    status: i32,
    index: i32,
    elapsed_ms: i32,
    duration_ms: i32,
    volume: i32,
    shuffle: i32,
    path: [u8; 260],
    title: [u8; 128],
    artist: [u8; 128],
    album: [u8; 128],
    codec: [u8; 16],
    frequency: i32,
    bitrate: i32,
}

/// Mirrors `struct pocketjs_system` on the C side.
#[repr(C)]
struct System {
    battery_percent: i32,
    charging: i32,
    hour: i32,
    minute: i32,
    weekday: i32,
    day: i32,
    month: i32,
}

extern "C" {
    fn pocketjs_host_playback(out: *mut Playback);
    fn pocketjs_host_system(out: *mut System);
    /// Current track's album art as Rockbox RGB565 (row stride = width).
    /// Returns its buffer handle, or a negative value when there is none.
    fn pocketjs_host_album_art(pixels: *mut *const u16, w: *mut i32, h: *mut i32) -> i32;
}

/// Album art size. PocketJS textures are power-of-two squares here; the
/// host requests this size from Rockbox, and covers that are not square are
/// centred (transparent around them).
pub const ART_SIZE: usize = 128;
/// Corner radius baked into the art's alpha, anti-aliased.
const ART_RADIUS: i32 = 14;
/// Colours reported without art.
const NO_ART_COLOR: &str = "#000000";

/// "#rrggbb" of an accumulated (r, g, b, count) average.
fn average((r, g, b, n): (u32, u32, u32, u32)) -> String {
    let n = n.max(1);
    let mut s = String::new();
    let _ = write!(s, "#{:02x}{:02x}{:02x}", r / n, g / n, b / n);
    s
}

/// Coverage of one corner's pixels, 0..=255 (4x4 subsamples), computed at
/// compile time. Index [y * R + x] with (0, 0) at the outer corner.
const CORNER: [u8; (ART_RADIUS * ART_RADIUS) as usize] = {
    let (r, mut t) = (ART_RADIUS * 4, [0u8; (ART_RADIUS * ART_RADIUS) as usize]);
    let mut i = 0;
    while i < t.len() {
        let (x, y) = ((i as i32 % ART_RADIUS) * 4, (i as i32 / ART_RADIUS) * 4);
        let mut inside = 0;
        let mut s = 0;
        while s < 16 {
            let (dx, dy) = (r - (x + s % 4), r - (y + s / 4));
            if dx * dx + dy * dy <= r * r {
                inside += 1;
            }
            s += 1;
        }
        t[i] = (inside * 255 / 16) as u8;
        i += 1;
    }
    t
};

/// Alpha of art pixel (x, y): opaque except inside the four corners.
fn corner_alpha(x: usize, y: usize) -> u8 {
    let (r, last) = (ART_RADIUS as usize, ART_SIZE - 1);
    let (cx, cy) = (x.min(last - x), y.min(last - y));
    if cx >= r || cy >= r { 255 } else { CORNER[cy * r + cx] }
}

struct Art {
    handle: i32,
    pixels: *const u16,
    texture: i32,
    serial: u32,
    name: String,
    /// Average colours of the art's top and bottom halves, "#rrggbb"
    colors: (String, String),
    /// (art node, texture) last bound, so binding only happens on change
    bound: (i32, i32),
    /// Node id from the last tree search, revalidated by name each frame
    art_node: NodeId,
}
static mut ART: Art = Art {
    handle: -1,
    pixels: core::ptr::null(),
    texture: -1,
    serial: 0,
    name: String::new(),
    colors: (String::new(), String::new()),
    bound: (0, -1),
    art_node: NodeId::NONE,
};

/// MicroTS <Image src> must be a literal, so the app renders a placeholder
/// Image inside a View named `AlbumArt` and the host points it at the
/// current art texture.
const ART_NODE: &str = "AlbumArt";

fn find_named(ui: &Ui, node: i32, name: &str) -> Option<NodeId> {
    let id = NodeId(node);
    if ui.debug_name(id) == Some(name) {
        return Some(id);
    }
    ui.core().node_children(node).iter().find_map(|&child| find_named(ui, child, name))
}

/// `cache` if it still carries `name`, else a fresh tree search. The view
/// remounts nodes (e.g. <Show>), so ids are revalidated, not trusted.
fn named(ui: &Ui, cache: &mut NodeId, name: &str) -> Option<NodeId> {
    if *cache == NodeId::NONE || ui.debug_name(*cache) != Some(name) {
        *cache = find_named(ui, NodeId::ROOT.0, name).unwrap_or(NodeId::NONE);
    }
    (*cache != NodeId::NONE).then_some(*cache)
}

/// Binds the art texture to the AlbumArt node whenever either changes.
pub fn bind_art(ui: &mut Ui) {
    // SAFETY: the UI thread is the only user of ART.
    let art = unsafe { &mut *core::ptr::addr_of_mut!(ART) };
    if art.texture < 0 {
        return;
    }
    let image = named(ui, &mut art.art_node, ART_NODE)
        .and_then(|view| ui.core().node_children(view.0).first().map(|&child| NodeId(child)));
    let Some(node) = image else {
        art.bound = (0, -1);
        return;
    };
    if art.bound != (node.0, art.texture) {
        ui.set_image(node, art.texture);
        art.bound = (node.0, art.texture);
    }
}

/// Uploads the current track's art when it changes and returns a name that
/// changes per upload ("" without art), so the app knows when art exists.
fn album_art(ui: &mut Ui) -> String {
    // SAFETY: the UI thread is the only user of ART.
    let art = unsafe { &mut *core::ptr::addr_of_mut!(ART) };
    let (mut pixels, mut w, mut h) = (core::ptr::null(), 0, 0);
    let handle = unsafe { pocketjs_host_album_art(&mut pixels, &mut w, &mut h) };
    if handle == art.handle && pixels == art.pixels {
        return art.name.clone();
    }
    art.handle = handle;
    art.pixels = pixels;
    if art.texture >= 0 {
        ui.core_mut().free_texture(art.texture);
        art.texture = -1;
    }
    art.name.clear();
    let (w, h) = (w as usize, h as usize);
    if handle < 0 || pixels.is_null() || w == 0 || h == 0 {
        return String::new();
    }
    let (cw, ch) = (w.min(ART_SIZE), h.min(ART_SIZE));
    let (sx, sy) = ((w - cw) / 2, (h - ch) / 2);
    let (dx, dy) = ((ART_SIZE - cw) / 2, (ART_SIZE - ch) / 2);
    // SAFETY: C guarantees w*h pixels at `pixels` while the handle is current.
    let src = unsafe { slice::from_raw_parts(pixels, w * h) };
    let mut rgba = alloc::vec![0u8; ART_SIZE * ART_SIZE * 4];
    let (mut top, mut bottom) = ((0, 0, 0, 0), (0, 0, 0, 0));
    for (y, row) in src.chunks_exact(w).skip(sy).take(ch).enumerate() {
        for (x, &px) in row[sx..sx + cw].iter().enumerate() {
            // Rockbox RGB565 -> RGBA8888
            let (r5, g6, b5) = ((px >> 11) as u32, ((px >> 5) & 0x3f) as u32, (px & 0x1f) as u32);
            let (r, g, b) = (r5 << 3 | r5 >> 2, g6 << 2 | g6 >> 4, b5 << 3 | b5 >> 2);
            let half = if y < ch / 2 { &mut top } else { &mut bottom };
            *half = (half.0 + r, half.1 + g, half.2 + b, half.3 + 1);
            let (ox, oy) = (dx + x, dy + y);
            let o = (oy * ART_SIZE + ox) * 4;
            rgba[o..o + 4].copy_from_slice(&[r as u8, g as u8, b as u8, corner_alpha(ox, oy)]);
        }
    }
    art.colors = (average(top), average(bottom));
    let texture = ui.core_mut().upload_texture(&rgba, ART_SIZE as u32, ART_SIZE as u32, psm::PSM_8888);
    if texture < 0 {
        return String::new();
    }
    art.texture = texture;
    art.serial = art.serial.wrapping_add(1);
    let _ = write!(art.name, "art-{}", art.serial);
    art.name.clone()
}

fn string(s: &str) -> Value {
    Value::String(String::from(s))
}

fn cstr(bytes: &[u8]) -> &str {
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(bytes.len());
    core::str::from_utf8(&bytes[..end]).unwrap_or("")
}

fn text(bytes: &[u8]) -> Value {
    string(cstr(bytes))
}

fn object(fields: Vec<(&str, Value)>) -> Value {
    Value::Object(fields.into_iter().map(|(k, v)| (String::from(k), v)).collect())
}

fn art_color(top: bool) -> Value {
    // SAFETY: the UI thread is the only user of ART.
    let art = unsafe { &*core::ptr::addr_of!(ART) };
    let color = if art.texture < 0 { NO_ART_COLOR } else if top { &art.colors.0 } else { &art.colors.1 };
    string(color)
}

/// Font slot of the title the shell measures for its marquee: text-xl
/// font-bold (20 px bold, see fontSlotFor in framework/compiler/tailwind.ts).
const TITLE_FONT_SLOT: u8 = 11;

fn playback(ui: &mut Ui) -> Value {
    // SAFETY: plain-old-data struct; C fills every field.
    let mut p: Playback = unsafe { core::mem::zeroed() };
    unsafe { pocketjs_host_playback(&mut p) };
    let status = match p.status {
        1 => "playing",
        2 => "paused",
        _ => "stopped",
    };
    object(vec![
        ("kind", string("ok")),
        ("status", string(status)),
        ("index", Value::I32(p.index)),
        ("path", text(&p.path)),
        ("title", text(&p.title)),
        ("titleWidth", Value::I32(ui.core().measure_text(cstr(&p.title), TITLE_FONT_SLOT) as i32)),
        ("artist", text(&p.artist)),
        ("album", text(&p.album)),
        ("elapsedMs", Value::I32(p.elapsed_ms)),
        ("durationMs", Value::I32(p.duration_ms)),
        ("volume", Value::I32(p.volume)),
        ("shuffle", Value::Bool(p.shuffle != 0)),
        ("codec", text(&p.codec)),
        ("frequency", Value::I32(p.frequency)),
        ("bitrate", Value::I32(p.bitrate)),
        ("art", Value::String(album_art(ui))),
        ("artTop", art_color(true)),
        ("artBottom", art_color(false)),
    ])
}

fn system() -> Value {
    // SAFETY: plain-old-data struct; C fills every field.
    let mut s: System = unsafe { core::mem::zeroed() };
    unsafe { pocketjs_host_system(&mut s) };
    object(vec![
        ("kind", string("ok")),
        ("batteryPercent", Value::I32(s.battery_percent)),
        ("charging", Value::Bool(s.charging != 0)),
        ("hour", Value::I32(s.hour)),
        ("minute", Value::I32(s.minute)),
        ("weekday", Value::I32(s.weekday)),
        ("day", Value::I32(s.day)),
        ("month", Value::I32(s.month)),
    ])
}

/// Answers every pending service request; deliveries apply on the next frame.
pub fn serve(ui: &mut Ui) {
    let requests: Vec<_> = ui.drain_model_requests().collect();
    for r in requests {
        let value = match (r.service.as_str(), r.call.as_str()) {
            (PLAYBACK, "snapshot") => playback(ui),
            (SYSTEM, "snapshot") => system(),
            _ => object(vec![("kind", string("malformed"))]),
        };
        ui.queue_model_delivery(Delivery { request: r.request, result: Completion::Value(value) });
    }
    bind_art(ui);
}
