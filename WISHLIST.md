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
  - *Legend colour range per variable across the run.* `tRIBSMeshViz.to_gltf` scales each legend to that one
    file's min/max, so colours are not comparable between time steps while animating. Fix is to compute the range
    over all time steps of a variable once and pass it to `_build_voronoi_gltf`/`_generate_legend_for_values`.
  - *`regenerate_viz` management command.* `viz` is only built at dataset creation (`Dataset.generate_visualization`),
    so existing glTF datasets need a one-off shell loop to pick up `viz.variables`. A
    `tethysapp/tribs/management/commands/regenerate_viz.py` with a `--dataset-type` filter would make this routine.
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

## App

- **Dev-only React root URL.** `reactapp/config/development.env` now sets `TETHYS_APP_ROOT_URL="/"` for the
  standalone-mode dev container. If the tribs app is also developed in multi-app mode, the dev container should write
  its own copy of that file (as the production Dockerfile does) instead of changing the shared one.
