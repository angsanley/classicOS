// classicOS's row cache for its album background.
use pocketjs_core::{
    damage::{DamageError, DamagePlan, DamagePolicy, DamageRect, DamageTarget, DamageTracker},
    raster,
    resources::RenderResources,
    spec::{draw_op, GradDir},
};

pub struct Background {
    rows: [u16; 240],
    prefix: [u32; 13],
    prefix_len: usize,
}

impl Background {
    pub const fn new() -> Self {
        Self {
            rows: [0; 240],
            prefix: [0; 13],
            prefix_len: 0,
        }
    }

    fn prepare(&mut self, ui: &impl RenderResources, words: &[u32]) -> usize {
        let (width, height) = ui.viewport();
        let (width, height) = (width as i32, height as i32);
        // native-size full-screen vertical backgrounds only.
        // Different layouts and taller viewports use the regular renderer.
        if width <= 0
            || height <= 0
            || height as usize > self.rows.len()
            || words.len() < 6
            || words[0] != draw_op::GRAD_RECT
            || words[1] != 0
            || words[2] != dimensions(width, height)
            || words[3] >> 24 != 255
            || words[4] >> 24 != 255
            || (words[5] != GradDir::ToBottom as u32 && words[5] != GradDir::ToTop as u32)
        {
            return 0;
        }
        let mut len = 6;
        // A full-screen root scissor has no effect. Its trailing POP also
        // has no effect once the remaining nested scissors have been popped.
        if words.len() >= 9
            && words[6] == draw_op::SCISSOR
            && words[7] == 0
            && words[8] == dimensions(width, height)
        {
            len = 9;
        }
        if words.len() >= len + 4
            && words[len] == draw_op::RECT
            && words[len + 1] == 0
            && words[len + 2] == dimensions(width, height)
        {
            len += 4;
        }
        if self.prefix_len != len || self.prefix[..len] != words[..len] {
            // Render one column with the existing rasterizer: no duplicate
            // gradient or RGB565 blending math, and identical rounding.
            raster::render_scaled_rgb565_window_over(
                ui,
                &words[..len],
                &mut self.rows[..height as usize],
                1,
                DamageRect::new(0, 0, 1, height),
            );
            self.prefix[..len].copy_from_slice(&words[..len]);
            self.prefix_len = len;
        }
        len
    }

    pub fn render(
        &mut self,
        ui: &impl RenderResources,
        words: &[u32],
        fb: &mut [u16],
        tracker: &mut DamageTracker<8>,
    ) -> Result<DamagePlan<8>, DamageError> {
        let (width, height) = ui.viewport();
        let (width, height) = (width as usize, height as usize);
        assert_eq!(fb.len(), width * height);
        // Track the original list, including the cached operations, so new
        // album colors or tint still invalidate the correct screen regions.
        let target = DamageTarget::new(
            width as u32,
            height as u32,
            1,
            u32::from_be_bytes(*b"R565") as u64,
        );
        let plan = tracker
            .prepare(ui, words, target)?
            .with_policy(DamagePolicy::default())?;
        let skip = self.prepare(ui, words);
        if skip == 0 {
            raster::render_scaled_rgb565_regions(ui, words, fb, 1, plan.regions());
        } else {
            let screen = DamageRect::new(0, 0, width as i32, height as i32);
            for region in plan.regions() {
                let region = region.intersect(screen);
                if region.is_empty() {
                    continue;
                }
                for y in region.y0..region.y1 {
                    let start = y as usize * width + region.x0 as usize;
                    fb[start..start + (region.x1 - region.x0) as usize].fill(self.rows[y as usize]);
                }
            }
            raster::render_scaled_rgb565_regions_over(ui, &words[skip..], fb, 1, plan.regions());
        }
        tracker.commit(ui, words, target);
        Ok(plan)
    }
}

fn dimensions(width: i32, height: i32) -> u32 {
    width as u32 | ((height as u32) << 16)
}

static mut BACKGROUND: Background = Background::new();

pub fn render(
    ui: &impl RenderResources,
    words: &[u32],
    fb: &mut [u16],
    tracker: &mut DamageTracker<8>,
) -> Result<DamagePlan<8>, DamageError> {
    // classicOS calls this on its single UI thread, like the host's tracker.
    unsafe { (*core::ptr::addr_of_mut!(BACKGROUND)).render(ui, words, fb, tracker) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pocketjs_core::raster::render_scaled_rgb565;
    fn xy_word(x: i32, y: i32) -> u32 {
        x as u16 as u32 | ((y as u16 as u32) << 16)
    }
    fn wh_word(w: i32, h: i32) -> u32 {
        w as u32 | ((h as u32) << 16)
    }
    #[test]
    fn cached_row_background_matches_full_rgb565_rendering() {
        let mut ui = pocketjs_core::Ui::new();
        ui.set_viewport(8.0, 6.0);
        for height in [6, 241] {
            ui.set_viewport(8.0, height as f32);
            let mut cache = Background::new();
            let mut tracker = DamageTracker::<8>::new();
            let mut actual = vec![0; (8 * height) as usize];
            let mut expected = actual.clone();
            let mut words = vec![
                draw_op::GRAD_RECT,
                xy_word(0, 0),
                wh_word(8, height),
                0xff70_625b,
                0xff1c_1816,
                GradDir::ToBottom as u32,
                draw_op::SCISSOR,
                xy_word(0, 0),
                wh_word(8, height),
                draw_op::RECT,
                xy_word(0, 0),
                wh_word(8, height),
                0x4000_0000,
                draw_op::SCISSOR,
                xy_word(2, 1),
                wh_word(4, 4),
                draw_op::RECT,
                xy_word(1, 2),
                wh_word(4, 2),
                0x24ff_ffff,
                draw_op::SCISSOR_POP,
                draw_op::SCISSOR_POP,
                draw_op::RECT,
                xy_word(7, 5),
                wh_word(1, 1),
                0xff00_00ff,
            ];
            for step in 0..8 {
                match step {
                    1 => words[19] = 0x03ff_ffff, // partial focus repaint
                    2 => words[3] = 0xffc0_8040,  // new album palette
                    3 => words[12] = 0x80ff_2030, // new tint
                    4 => words[5] = GradDir::ToTop as u32,
                    5 => words[5] = GradDir::ToRight as u32, // fallback
                    6 => {
                        words[5] = GradDir::ToBottom as u32;
                        words[3] = 0x80c0_8040;
                    }
                    7 => {
                        words[3] = 0xffc0_8040;
                        words[8] = wh_word(7, height);
                    }
                    _ => {}
                }
                cache
                    .render(&ui, &words, &mut actual, &mut tracker)
                    .unwrap();
                render_scaled_rgb565(&ui, &words, &mut expected, 1);
                assert_eq!(actual, expected, "step {step}, height {height}");
                let idle = cache
                    .render(&ui, &words, &mut actual, &mut tracker)
                    .unwrap();
                assert!(idle.regions().is_empty());
            }
        }
    }
}
