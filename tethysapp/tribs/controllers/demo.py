from django.shortcuts import render
from tethys_sdk.routing import controller
from tethys_sdk.gizmos import CesiumMapView


@controller(name="mesh_map", url="tribs/mesh-map")
def mesh_map(request):
    """
    Demo of visualizing tRIBS mesh output in Cesium.
    """
    # Get the access token
    cesium_ion_token = \
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMTYyMjAxNC02MGEzLTQ2NDgtYWQ5ZC0yZTQxOGZkYWUzNTEiLCJpZCI6Mj" \
        "E3MzAsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJnYyJdLCJpYXQiOjE1ODA0MjEwMTN9.ibyvoPsv8fyB_9uiZJvQsn3nB_XWV8M1Zbmq6rj-EWw"

    cesium_map_view = CesiumMapView(
        cesium_ion_token=cesium_ion_token,
        height="800px",
    )

    context = {
        'cesium_map_view': cesium_map_view,
        'cesium_ion_token': cesium_ion_token,
    }
    return render(request, 'tribs/mesh_map.html', context)


@controller(name="mesh_vtk", url="tribs/mesh-vtk")
def mesh_vtk(request):
    """
    Demo of visualizing tRIBS mesh output with VTK.js.
    """
    context = {}
    return render(request, 'tribs/mesh_vtk.html', context)
