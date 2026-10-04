# classicOS userspace: replaces the Rockbox UI sources (apps/SOURCES).
# Enabled by CLASSICOS=1, which apps/classicos/configure.sh writes into the
# generated build Makefile.

SRC += $(call preprocess, $(APPSDIR)/classicos/SOURCES)

# firmware/ calls into librbcodec; normally apps/ objects pull those members in
# first, so with our minimal apps/ the archive must come after libfirmware too.
CORE_LDOPTS += -Wl,--start-group $(RBCODECLIB) $(FIRMLIB) -Wl,--end-group
