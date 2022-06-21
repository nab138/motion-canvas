## [3.0.3](https://github.com/motion-canvas/core/compare/v3.0.2...v3.0.3) (2022-06-21)


### Bug Fixes

* display newlines in Code correctly ([#38](https://github.com/motion-canvas/core/issues/38)) ([df8f390](https://github.com/motion-canvas/core/commit/df8f390848d7a8e03193d64e460142e00ed95031))

## [3.0.2](https://github.com/motion-canvas/core/compare/v3.0.1...v3.0.2) (2022-06-17)


### Bug Fixes

* save time events only if they're actively used ([#35](https://github.com/motion-canvas/core/issues/35)) ([bd78c89](https://github.com/motion-canvas/core/commit/bd78c8967ba395beeb352006b5f33768b4a4c498)), closes [#33](https://github.com/motion-canvas/core/issues/33) [#34](https://github.com/motion-canvas/core/issues/34)

## [3.0.1](https://github.com/motion-canvas/core/compare/v3.0.0...v3.0.1) (2022-06-16)


### Bug Fixes

* fix meta file version and timing ([#32](https://github.com/motion-canvas/core/issues/32)) ([a369610](https://github.com/motion-canvas/core/commit/a36961007eb7ac238b87ade3a03da101a1940800))

# [3.0.0](https://github.com/motion-canvas/core/compare/v2.2.0...v3.0.0) (2022-06-16)


### Features

* add meta files ([#28](https://github.com/motion-canvas/core/issues/28)) ([e29f7d0](https://github.com/motion-canvas/core/commit/e29f7d0ed01c7fb84f0931be5485fdde1aa0a5c2)), closes [#7](https://github.com/motion-canvas/core/issues/7)


### BREAKING CHANGES

* change time events API

# [2.2.0](https://github.com/motion-canvas/core/compare/v2.1.1...v2.2.0) (2022-06-16)


### Bug Fixes

* load project state correctly ([#27](https://github.com/motion-canvas/core/issues/27)) ([8ae0233](https://github.com/motion-canvas/core/commit/8ae02335d71858413bffb265573bd83a1e38d89e))


### Features

* add ease back interp functions ([#30](https://github.com/motion-canvas/core/issues/30)) ([c11046d](https://github.com/motion-canvas/core/commit/c11046d939bf5a29e28bda0ef97feabe2f985a0f))

## [2.1.1](https://github.com/motion-canvas/core/compare/v2.1.0...v2.1.1) (2022-06-15)


### Bug Fixes

* add monospace font fallback in case JetBrains Mono is missing ([#24](https://github.com/motion-canvas/core/issues/24)) ([276a310](https://github.com/motion-canvas/core/commit/276a310d63a4ea128a3640d6e0871045514c1c01)), closes [#16](https://github.com/motion-canvas/core/issues/16)
* code will trigger PrismJS such that JSX is correctly highlighted ([#20](https://github.com/motion-canvas/core/issues/20)) ([b323231](https://github.com/motion-canvas/core/commit/b32323184b5f479bc09950fdf9c570b5276ea600)), closes [#17](https://github.com/motion-canvas/core/issues/17)
* fix hot reload ([#26](https://github.com/motion-canvas/core/issues/26)) ([2ad746e](https://github.com/motion-canvas/core/commit/2ad746e1eff705c2eb29ea9c83ad9810eeb54b05))

# [2.1.0](https://github.com/motion-canvas/core/compare/v2.0.0...v2.1.0) (2022-06-14)


### Bug Fixes

* create missing output directories ([#13](https://github.com/motion-canvas/core/issues/13)) ([17f1e3f](https://github.com/motion-canvas/core/commit/17f1e3fd37ec89998d67b22bd6762fc85b4778a2)), closes [#4](https://github.com/motion-canvas/core/issues/4)


### Features

* force rendering to restart seek time ([#14](https://github.com/motion-canvas/core/issues/14)) ([e94027a](https://github.com/motion-canvas/core/commit/e94027a36fe2a0b11f3aa42bb3fa869c10fbe1ea)), closes [#6](https://github.com/motion-canvas/core/issues/6)
* move back playhead by a frame ([#18](https://github.com/motion-canvas/core/issues/18)) ([b944cd7](https://github.com/motion-canvas/core/commit/b944cd71c075e10622bd7bc81de90024c73438b7))

# [2.0.0](https://github.com/motion-canvas/core/compare/v1.1.0...v2.0.0) (2022-06-12)


### Bug Fixes

* restrict the corner radius of a rectangle ([#9](https://github.com/motion-canvas/core/issues/9)) ([cc86a4a](https://github.com/motion-canvas/core/commit/cc86a4a6d5b44e75ed02a1bdf90b588450a663b2)), closes [#8](https://github.com/motion-canvas/core/issues/8)


### Features

* add basic documentation structure ([#10](https://github.com/motion-canvas/core/issues/10)) ([1e46433](https://github.com/motion-canvas/core/commit/1e46433af37e8fec18dec6efc7dc1e3b70d9a869)), closes [#2](https://github.com/motion-canvas/core/issues/2)
* add eslint ([658f468](https://github.com/motion-canvas/core/commit/658f468318c8ad88088bd5230172fb4d0bc2af00))


### BREAKING CHANGES

* `waitFor` and `waitUntil` were moved

They should be imported from `@motion-canvas/core/lib/flow`.

# [1.1.0](https://github.com/motion-canvas/core/compare/v1.0.0...v1.1.0) (2022-06-08)


### Bug Fixes

* add missing canvas package ([26c8f4f](https://github.com/motion-canvas/core/commit/26c8f4ff9947841b38f123466b7efd7f43706ffb))


### Features

* add support for npm workspaces ([741567f](https://github.com/motion-canvas/core/commit/741567f8af4185a2b1bc5284064514d96e75f5f2))

# 1.0.0 (2022-06-08)


### Bug Fixes

* MeshBoneMaterial opacity ([24db561](https://github.com/motion-canvas/core/commit/24db5613aca19e5de2672aaf31f422e51aee19c8))
* previous scene invisible when seeking ([65e32f0](https://github.com/motion-canvas/core/commit/65e32f03b79af730064c935eaf1645019c303399))
* previous scenes not getting disposed ([bf3a1fc](https://github.com/motion-canvas/core/commit/bf3a1fcf5fc22758893b5b742ca00a5741a5d560))
* respect child origins in LinearLayout ([5ee114d](https://github.com/motion-canvas/core/commit/5ee114ddd9e48d6cea5360ea090c17f1dbc8c641))
* save timeline state ([9d57b8a](https://github.com/motion-canvas/core/commit/9d57b8ae1f7cfd6ec468d3348aa0fda4afd88a84))


### Features

* add layered layout ([381b2c0](https://github.com/motion-canvas/core/commit/381b2c083d90aa4fe815370afd0138dde114bf4a))
* add LayoutText ([328b7b7](https://github.com/motion-canvas/core/commit/328b7b7f193b60223269002812f29922bc78132e))
* AnimationClip ([681146a](https://github.com/motion-canvas/core/commit/681146a8e92a4360975472939eb2494b89f02eff))
* arc tween ratio ([27dbb0b](https://github.com/motion-canvas/core/commit/27dbb0bd2749600cdee6944a469ee10870989a28))
* audio playback ([e9a6fdb](https://github.com/motion-canvas/core/commit/e9a6fdb51e62dd8e7a0ca43e7ae6908ff7d92c53))
* audio toggle control ([300f18e](https://github.com/motion-canvas/core/commit/300f18e9c9c0ad559edb14bbfce889a717ab15c2))
* better playback controls ([796ae33](https://github.com/motion-canvas/core/commit/796ae3356c4853a38e1e6471cb62e73b47f02fd2))
* better time events ([8c2bf27](https://github.com/motion-canvas/core/commit/8c2bf27ac7bac9d6f77a15ec99d433baa4329c0e))
* browser based renderer ([13dc24c](https://github.com/motion-canvas/core/commit/13dc24ca69e31dab911cc1211b56684c28425e85))
* circular mask for surfaces ([4db62d8](https://github.com/motion-canvas/core/commit/4db62d8a6572dda0931e0826f2fab359ee9accad))
* clamp function ([94543d1](https://github.com/motion-canvas/core/commit/94543d1079a46d9a8c8d26b87bd91dc2c5e17aea))
* color picker ([ac48055](https://github.com/motion-canvas/core/commit/ac48055b4ffd833fb1fca6fcd0b2fd7d38a57aab))
* configurable framerate and resolution ([a715f5c](https://github.com/motion-canvas/core/commit/a715f5c1acd28e2e1dd5496ea8cb4b23b4cea7be))
* connections ([49254fc](https://github.com/motion-canvas/core/commit/49254fc36cc03c8f8557c14ff86ab38f56229b04))
* custom loaders ([5a3ab9a](https://github.com/motion-canvas/core/commit/5a3ab9ad4d2d332d99d594c8812adc32a8d4b04c))
* directional padding and margin ([441d121](https://github.com/motion-canvas/core/commit/441d1210adbd85406d7dbe2edc21da044724a1ee))
* follow utility ([fddfc67](https://github.com/motion-canvas/core/commit/fddfc67a42fc0f8e2a6f76d00a30c813592caf9e))
* function components ([178db3d](https://github.com/motion-canvas/core/commit/178db3d95c091e9abdf79e67548836332f40dc89))
* general improvements ([320cced](https://github.com/motion-canvas/core/commit/320ccede3d764b8aabbcea2d92ee808efa36708a))
* general improvements ([dbff3cc](https://github.com/motion-canvas/core/commit/dbff3cce379fb18eec5900ef9d90ba752ab826b4))
* grid ([d201a4d](https://github.com/motion-canvas/core/commit/d201a4d09393001f7106c2f33b17b49434f047e7))
* grid overlay ([f7aca18](https://github.com/motion-canvas/core/commit/f7aca1854c390c90bea3614180eb73b1f91375b8))
* improve layouts ([9a1fb5c](https://github.com/motion-canvas/core/commit/9a1fb5c7cd740a6f696c907a8f1d8ed900995985))
* jsx ([3a633e8](https://github.com/motion-canvas/core/commit/3a633e882714c85043c014f98cad2d5d30b40607))
* layouts ([749f929](https://github.com/motion-canvas/core/commit/749f9297beae67bfa61cfcdf45806329574b75d1))
* loading indication ([93638d5](https://github.com/motion-canvas/core/commit/93638d5e056711fa0f0473d20d16074d9c6f3fd5))
* mask animation ([5771963](https://github.com/motion-canvas/core/commit/57719638cbca8f93c0e36f9380bfbe557a8633cd))
* package separation ([e69a566](https://github.com/motion-canvas/core/commit/e69a56635fbc073766018c8e53139a2135dbca10))
* playback controls ([94dab5d](https://github.com/motion-canvas/core/commit/94dab5dc1b8deaa4eaab561454699b3c22393618))
* Promise support ([711f793](https://github.com/motion-canvas/core/commit/711f7937d86a9a0b2b7011b25799499d786e056d))
* remove ui elements ([8e5c288](https://github.com/motion-canvas/core/commit/8e5c288750dfe9f697939abac03678b7885df428))
* renderer ui ([8a4e5d3](https://github.com/motion-canvas/core/commit/8a4e5d32b1e55f054bf3e98ef54c49f66655c034))
* scene transitions ([d45f1d3](https://github.com/motion-canvas/core/commit/d45f1d36bd23fbb5d07c6865ae31e624cba11bd2))
* sprites and threading ([a541682](https://github.com/motion-canvas/core/commit/a5416828bfb5d40f92c695b8a9a6df7b2d6686ca))
* support lower framerate ([3c81086](https://github.com/motion-canvas/core/commit/3c81086829ad12dda805c355649cce7c0f156d2e))
* surfaceFrom animation ([77bb69e](https://github.com/motion-canvas/core/commit/77bb69e6a6481d412f800f65b6303c4c5f33cc94))
* surfaces ([99f9e96](https://github.com/motion-canvas/core/commit/99f9e96a108bbd2a08a1931fd042a5969354da60))
* threading ([e9f6b2a](https://github.com/motion-canvas/core/commit/e9f6b2ad0838f0240e8bbd196061ba6ce23eac27))
* three.js integration ([79cc975](https://github.com/motion-canvas/core/commit/79cc975ecaa35d54f0e530f9b732d6472d965c3a))
* time events ([f47cc66](https://github.com/motion-canvas/core/commit/f47cc666f64ee5733ebe200503bd94a1a48a9c02))
* time parameter for tweens ([3fe90ed](https://github.com/motion-canvas/core/commit/3fe90edc49abb910522c75d4df3c56b40c29731f))
* use Web Audio API for waveform generation ([817e244](https://github.com/motion-canvas/core/commit/817e244bb2187532df7142199917412ccfe8d218))
* useAnimator utility ([ad32e8a](https://github.com/motion-canvas/core/commit/ad32e8a0add494021d4c5c9fe5b3915189f00a08))
* waveform data ([400a756](https://github.com/motion-canvas/core/commit/400a756ebf7ee174d8cbaf03f1f74eddd1b75925))