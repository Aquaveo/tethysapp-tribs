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
    the Variables panel (the Legends panel does show it).
  - *Other visible meshes only change step when the clock-driving variable does* (deferred from the Copilot review
    of PR #17, 2026-11-10). `MeshClock.js` publishes `meshClockTime` only when the step index of the active
    variable changes. A second visible mesh on a different step grid (driver every 20 h, the other at 0/10/20 h)
    and its legend stay on a stale step until the driver crosses a boundary. Meshes that share the driver's steps,
    the usual case, are not affected. Options: publish when any visible series crosses a step, or have each
    `GltfLayer` derive its step from the clock itself.
  - *Clock hand-over comment in `VariablesPanel.js`* (review of the PR #17 fixes, 2026-11-10). The mount effect's
    comment says a hidden dataset takes the clock when it is revealed. That holds for `RealizationOutputTreeItem`,
    but `GISTreeItem` also mounts the panel and its reveal never calls `setActiveTimeSeries`. Harmless while GIS
    datasets are never time series glTF; correct the comment, or hand over the clock there too if that changes.
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
  `getRampShader` in `GltfLayers.js`, selector + browser-drawn `GltfLegend` in `LegendCard.js`, ramp saved as the
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

- **Split the three long glTF methods** (deferred from the tribs-adapter PR #12 review, 2026-11-10). `tRIBSMeshViz.to_gltf`
  (~108 lines, five levels deep) does extents, localization, geometry, the bare-mesh file, the per-variable files,
  the legends and the metadata in one body: extract a bare-mesh writer, a per-file/per-variable writer and a legend
  pass. `tRIBSMeshViz._assemble_gltf` (~140 lines) interleaves accessor, buffer-view and image layout with mesh
  construction: extract `_build_accessors`, `_build_buffer_views` and `_attach_image`. `TribsSpatialManager.
  create_tribs_tin_layer` finds the mesh file, filters output files, looks up the `_voi`, builds the legend labels
  and mutates the dataset: extract `_find_mesh_file` and `_build_variable_labels`. Behaviour-preserving refactors;
  the unit and intermediate tests cover the current behaviour.

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

- **Guard `get_output_file_units` against files without a units row** (deferred from the tribs-adapter PR #12 review,
  2026-11-10). `czml_converters.get_output_file_units` takes line two of an mrf/rft file as the units row. Every
  tRIBS mrf/rft we have has one, but a file without it would turn the first data row into "units" for variables the
  sheet does not know. Return `{}` (or skip the token) when a token parses as a number.

## App

- **Dev-only React root URL.** `reactapp/config/development.env` now sets `TETHYS_APP_ROOT_URL="/"` for the
  standalone-mode dev container. If the tribs app is also developed in multi-app mode, the dev container should write
  its own copy of that file (as the production Dockerfile does) instead of changing the shared one.

- **`tribs delete-datasets` follow-ups** (minor findings of the independent review of the PR #17 fixes, 2026-11-10):
  - *README wording on `--dry-run`.* "listed as skipped (also by `--dry-run`) and make the command exit with status
    1" reads as if a dry run exits 1 when datasets are skipped. A dry run always exits 0; say so, or make it exit 1.
  - *Unlink before deleting the files.* `delete_dataset` deletes the file collection before `unlink_references` and
    the commit. If unlinking fails, the rollback leaves a dataset that scenarios still refer to with no files.
    Drop the references first.
  - *List-valued `resource_id`.* `_drop_references` handles a `FileDatabasePath` whose `resource_id` is a list by
    assuming `file_collection_id` and `file_collection_paths` are lists of the same length, which the model does
    not guarantee, and leaves `path` unchanged. In a collection, an entry with a list of ids is removed whole.
    Nothing in the app or adapter writes list-valued ids today, so the branch is only reached by its unit test:
    either drop it (leave the card empty) or make the two cases consistent.
  - *Move the reference handling into tribs-adapter.* `_references` / `_drop_references` and the test helper encode
    the shape of the adapter's `FileDatabasePath` (scalar or list ids, what an empty card looks like). They belong
    next to `Scenario.unlink_dataset`, so a change to the model cannot silently break the command.
  - *One transaction model for the CLI tests.* `CommandSession` in `test_regenerate_viz_command.py` gives the
    command a savepoint per transaction, so a rollback after a commit does not undo the fixtures' rows on the
    shared test connection. The delete tests still use `session_maker()`. If more commands roll back after a
    commit, move it to `tests/integrated_tests/conftest.py` beside `session_maker`.
