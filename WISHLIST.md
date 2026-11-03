# Wish list

Follow-ups that were noted but deliberately deferred. Newest at the bottom.

## Dev container

- **Vendor the MPI C++ bindings with tRIBSpar instead of mixing package sources.** `tRIBSpar` links
  `libmpi.so.40` and `libmpi_cxx.so.40`. The dev image installs OpenMPI 4 from conda-forge (runtime + `mpirun`) and
  takes `libmpi_cxx.so.40` from Debian bookworm's OpenMPI 4.1.4 package, because conda-forge does not build the C++
  bindings and OpenMPI 5 (Debian 13) dropped them. Cleaner options: ship `libmpi_cxx.so.40` next to the binary in
  `tribs_adapter/tribs/`, or rebuild `tRIBSpar` against a consistently packaged MPI. See `Dockerfile.devcontainer`.
- **Stale PATH in `/etc/environment`.** The base image sets `PATH` to `/opt/conda/miniconda/envs/tethys/bin`, which
  does not exist (the env is `/opt/conda/envs/tethys`). Jobs work because scripts use the `/opt/tethys-python` shebang
  and the tRIBS launcher resolves `mpirun` itself, but anything relying on PATH in a Condor job will not find the env.
- **File database permissions on non-macOS hosts.** Condor jobs run as `condoruser` and write into root-owned file
  database directories. This only works because the Docker Desktop bind mount ignores ownership; on a Linux host the
  same setup would fail with permission errors.

## tRIBS output visualization (glTF)

- **Expose Voronoi cell clipping as a setting.** `tRIBSMeshViz(clip_cells_to_mesh=...)` clips cells to the mesh
  footprint (on by default), which removes the long slivers that flat boundary triangles produce at the outlet (see
  test6). The spatial manager does not pass the flag, so it cannot yet be turned off per dataset or per user.
- **Reduce glTF size further.** Voronoi rendering duplicates vertices per cell, so files are ~3.5x the old TIN
  files (7.4 MB per variable per time step on examplebasin). Dropping the NORMAL attribute or quantizing texture
  coordinates would cut this; one file per variable per time step is also worth revisiting.
- **Cell edges in the app.** The debugging viewer draws cell outlines; the app could ship a LINES primitive (or a
  second glTF) so outlines can be toggled in Cesium.
- **Mesh time series follow-ups** (the clock-driven animation itself landed 2026-10-08: `viz.variables` from the
  spatial manager, `lib/meshTimeSeries.js`, `MeshClock.js`, double-buffered `GltfLayers.js`, variables listed once in
  `VisibilityPropertyPanel.js`):
  - *Preload a window of time steps.* `GltfLayers.js` double-buffers (current + next), so playback waits for each
    ~7 MB file when the network is slow; a small cache of adjacent steps would smooth it.
  - *Time-step axis in the UI.* The Cesium timeline shows the range, but nothing labels the current time step in
    the Visibility Properties panel (the Legend panel does show it).
- **Detect inconsistent tRIBS mesh files before building Voronoi cells.** tRIBS's own output writer dumps
  `OUTFILENAME.nodes/.z` in internal list order while `.edges/.tri` keep the original ids (verified in tOutput.cpp,
  2026-10-08). Read as mesh input, every cell becomes a mesh-wide sliver (Cedar_Flats_Treated: 237 MB glb, 139 s).
  Our TIN workflows (xms `TRibsFileWriter`) are consistent and MeshBuilder does not touch the text files; the bad set
  came in an uploaded scenario. Plan: in `tRIBSMeshViz`, compare median triangle side to median nearest-node spacing
  (fixtures score 1.5-8.2, Cedar 233); above a threshold rebuild the triangulation with `scipy.spatial.Delaunay` for
  the bare TIN view (6 s, cells median 6.7 m) and raise a clear error for output datasets without a `_voi` file, since
  the output ids cannot be mapped to node rows. Recovering the id permutation without a `_voi` is possible via
  Delaunay/edge-graph isomorphism but was judged not worth it. Neither TIN workflow produces a `_voi`; only tRIBS runs do.

- **Selectable colour ramps follow-ups** (the client-side ramps landed 2026-10-15: `lib/colorRamps.js`,
  `getRampShader` in `GltfLayers.js`, selector + browser-drawn `GltfLegend` in `LegendPanel.js`, ramp saved as the
  dataset attribute `color_ramp`, `min`/`max` per variable in `viz.variables`):
  - *Other users only see a saved ramp after reloading.* The consumer answers the requesting socket only
    (`BackendConsumer.send_action` never calls `group_send`), so a ramp change is not pushed to other open sessions.
    Live propagation needs a group event handler in `tethysapp/tribs/consumers/backend.py` and would change every
    action, so it was deferred.
  - *Old datasets have no `min`/`max`.* glTF datasets generated before 2026-10-15 recolour fine but their drawn
    legend has no tick labels until `viz` is rebuilt: run `tribs regenerate-viz` (landed 2026-10-29, see the README)
    on each deployment, e.g. `--dataset-type TRIBS_TIN --dataset-type TRIBS_OUT_TIME_INTEGRATED`. Production has
    not been regenerated yet.
  - *Default ramp as a texture.* The "Topo Atlas" default still uses the texture baked into the GLB, so its swatch in
    the selector is an approximation and its legend is the server PNG. Exposing the baked ramp's colours as a JS
    interpolator would let every ramp share one code path (and drop the PNG legend for glTF datasets entirely).

## Output variable labels and priorities

Landed 2026-10-30 (FHMB III 1.2/1.3): `tribs_adapter/common/output_variables.py` holds the scientist's sheet (qout,
mrf, integrated `_i`); the backend renders only priority/secondary variables of those kinds, labels them with
friendly names and display units in `viz.variables` and the timeseries responses, and the frontend groups secondary
variables under "More variables". Deferred:

- **Extend the sheet to the other output files.** Pixel, `.rft` and SDF station variables are not in the sheet, so
  they keep their raw names (plus the header unit token where there is one) and all stay visible. Once the scientist
  adds them, extend `OUTPUT_VARIABLES` and `KIND_BY_DATASET_TYPE`, then `tribs regenerate-viz` those types.
  (Time-dynamic `_d` output was dropped from realizations on 2026-10-30 at the scientist's request, as it is only an
  instantaneous snapshot; the `TRIBS_OUT_TIME_DYNAMIC` enum member stays until every environment has run
  `tribs delete-datasets --dataset-type TRIBS_OUT_TIME_DYNAMIC`, after which it and the `_d` branches of the mesh
  writer tests can go.)
- **Snow variables when there is no snow.** `peakWE`, `cSnSub`, `cSnEvap` (priority) are all zero in snow-free
  runs; grey them out or drop to secondary when the range is 0..0 (the sheet asks for this).
- **Plot conveniences from the sheet.** Inverted y-axis for `MDGW` (depth to groundwater), log colour scale for
  `CAr` (contributing area) and `Ks`, and promoting `SCA`/`cMelt` to priority for snow-dominated basins (maybe a
  per-project setting).
- **Constant fields get a 0..1 legend.** When a glTF variable's `min` equals its `max` (every Salas soil moisture
  and runoff variable in the dry test run), the drawn legend falls back to ticks from 0.00 to 1.00, which reads as a
  real range. Show a single value (or "constant") instead, and consider greying the variable out in the picker.
- **Older mrf column names.** Older tRIBS builds wrote `MGW`, `Max`, `Min`, `%Sat`, `%Rain` (the salas fixtures);
  they are aliased in the table. If other historical spellings show up (`Aspct`-style), add aliases rather than
  fuzzy matching.
- **Post-upgrade regeneration job.** `tribs regenerate-viz` stays a manual step (see README). If regenerations
  become routine, add a version-gated Helm post-upgrade job in the wrapper repo.

## App

- **Dev-only React root URL.** `reactapp/config/development.env` now sets `TETHYS_APP_ROOT_URL="/"` for the
  standalone-mode dev container. If the tribs app is also developed in multi-app mode, the dev container should write
  its own copy of that file (as the production Dockerfile does) instead of changing the shared one.
