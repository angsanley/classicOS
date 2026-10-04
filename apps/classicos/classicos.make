# classicOS userspace: replaces the Rockbox UI sources (apps/SOURCES).
# Enabled by CLASSICOS=1, which apps/classicos/configure.sh writes into the
# generated build Makefile.
#
#   PJS_APP   MicroTS app under pocketjs/apps/ to run (default ipod-video-demo)

SRC += $(call preprocess, $(APPSDIR)/classicos/SOURCES)

# firmware/ calls into librbcodec, and the Rust core into libfirmware's libc;
# normally apps/ objects pull those members in first, so group the archives.
CORE_LDOPTS += -Wl,--start-group $(RBCODECLIB) $(FIRMLIB) $(PJS_LIB) -Wl,--end-group

POCKETJS_DIR ?= $(ROOTDIR)/pocketjs
PJS_APP ?= ipod-video-demo
PJS_CRATE := $(POCKETJS_DIR)/hosts/rockbox
PJS_BUILD := $(BUILDDIR)/classicos
PJS_GEN := $(PJS_BUILD)/gen
PJS_LIB := $(BUILDDIR)/lib/libpocketjs.a
# Fonts and images, installed to /.rockbox/classicos/<app>/
PJS_DATA := $(PJS_BUILD)/data/$(PJS_APP)

ifeq ($(APP_TYPE),sdl-sim)
  PJS_CARGO := cargo build --locked --release
  PJS_LIBPATH := release/libpocketjs_rockbox.a
  PJS_SIMDATA := $(BUILDDIR)/simdisk/.rockbox/classicos/$(PJS_APP)
else
  # ARM code to match Rockbox C, which builds without -mthumb-interwork.
  PJS_RUST_TARGET := armv4t-none-eabi
  PJS_CARGO := cargo +nightly-2026-07-01 build --locked --release \
               --target $(PJS_RUST_TARGET) -Z build-std=core,alloc
  PJS_LIBPATH := $(PJS_RUST_TARGET)/release/libpocketjs_rockbox.a
endif

CORE_LIBS += $(PJS_LIB)

$(PJS_GEN)/include.rs: $(wildcard $(POCKETJS_DIR)/apps/$(PJS_APP)/*.ts*) $(PJS_CRATE)/gen.ts
	$(call PRINTS,MICROTS $(PJS_APP))cd $(POCKETJS_DIR) && \
		bun ./hosts/rockbox/gen.ts apps/$(PJS_APP)/app.tsx $(PJS_GEN) >/dev/null
	$(SILENT)rm -rf $(PJS_DATA) && mkdir -p $(PJS_DATA) && \
		cp $(PJS_GEN)/font-*.bin $(PJS_DATA)/ && \
		{ cp $(PJS_GEN)/*.rgba $(PJS_DATA)/ 2>/dev/null || true; }
ifdef PJS_SIMDATA
	$(SILENT)rm -rf $(PJS_SIMDATA) && mkdir -p $(dir $(PJS_SIMDATA)) && cp -R $(PJS_DATA) $(PJS_SIMDATA)
endif

$(PJS_LIB): $(PJS_GEN)/include.rs $(wildcard $(PJS_CRATE)/src/*.rs) $(PJS_CRATE)/Cargo.toml
	$(call PRINTS,CARGO pocketjs)cd $(PJS_CRATE) && \
		POCKETJS_GEN=$(PJS_GEN) CARGO_TARGET_DIR=$(PJS_BUILD)/cargo $(PJS_CARGO)
	$(SILENT)mkdir -p $(dir $@) && cp $(PJS_BUILD)/cargo/$(PJS_LIBPATH) $@
