# classicOS userspace: replaces the Rockbox UI sources (apps/SOURCES).
# Enabled by CLASSICOS=1, which apps/classicos/configure.sh writes into the
# generated build Makefile.
#
#   PJS_APP   run pocketjs/apps/<name> instead of the classicOS shell
#   PJS_HUD=1 profiling strip (fps, phase times, stack, free RAM), see host.c

SRC += $(call preprocess, $(APPSDIR)/classicos/SOURCES)

ifdef PJS_HUD
$(BUILDDIR)/apps/classicos/host.o: CFLAGS += -DPJS_HUD
endif

# firmware/ calls into librbcodec, and the Rust core into libfirmware's libc;
# normally apps/ objects pull those members in first, so group the archives.
CORE_LDOPTS += -Wl,--start-group $(RBCODECLIB) $(FIRMLIB) $(PJS_LIB) -Wl,--end-group

POCKETJS_DIR ?= $(ROOTDIR)/pocketjs
ifdef PJS_APP
  PJS_APP_DIR := $(POCKETJS_DIR)/apps/$(PJS_APP)
else
  PJS_APP_DIR := $(APPSDIR)/classicos/shell
  # Out-of-tree apps resolve solid-js and @pocketjs/framework through these.
  PJS_NODE_LINKS := $(PJS_APP_DIR)/node_modules/@pocketjs/framework
endif
PJS_APP_NAME := $(notdir $(PJS_APP_DIR))
PJS_CRATE := $(POCKETJS_DIR)/hosts/rockbox
PJS_BUILD := $(BUILDDIR)/classicos
PJS_GEN := $(PJS_BUILD)/gen
PJS_LIB := $(BUILDDIR)/lib/libpocketjs.a
# Fonts and images, installed to /.rockbox/classicos/<app>/
PJS_DATA := $(PJS_BUILD)/data/$(PJS_APP_NAME)

ifeq ($(APP_TYPE),sdl-sim)
  PJS_CARGO := cargo build --locked --release --features services
  PJS_LIBPATH := release/libpocketjs_rockbox.a
  PJS_SIMDATA := $(BUILDDIR)/simdisk/.rockbox/classicos/$(PJS_APP_NAME)
else
  # ARM code to match Rockbox C, which builds without -mthumb-interwork.
  PJS_RUST_TARGET := armv4t-none-eabi
  PJS_CARGO := cargo +nightly-2026-07-01 build --locked --release --features services \
               --target $(PJS_RUST_TARGET) -Z build-std=core,alloc
  PJS_LIBPATH := $(PJS_RUST_TARGET)/release/libpocketjs_rockbox.a
endif

CORE_LIBS += $(PJS_LIB)

$(PJS_NODE_LINKS):
	$(SILENT)mkdir -p $(dir $@) && ln -sfn $(POCKETJS_DIR) $@ && \
		ln -sfn $(POCKETJS_DIR)/node_modules/solid-js $(PJS_APP_DIR)/node_modules/solid-js

$(PJS_GEN)/include.rs: $(wildcard $(PJS_APP_DIR)/*.ts*) $(PJS_CRATE)/gen.ts | $(PJS_NODE_LINKS)
	$(call PRINTS,MICROTS $(PJS_APP_NAME))rm -rf $(PJS_GEN) && cd $(POCKETJS_DIR) && \
		bun ./hosts/rockbox/gen.ts $(PJS_APP_DIR)/app.tsx $(PJS_GEN) >/dev/null
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
