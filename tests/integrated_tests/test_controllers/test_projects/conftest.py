import json
import pytest


@pytest.fixture(scope="function")
def project_extent_geojson():
    return {
        "type":
            "GeometryCollection",
        "geometries":
            [
                {
                    "type":
                        "Polygon",
                    "coordinates":
                        [
                            [
                                [-112.0245487393517, 40.386174817657945], [-112.0245487393517, 39.99725613058138],
                                [-111.55135031076428, 39.99725613058138], [-111.55135031076428, 40.386174817657945],
                                [-112.0245487393517, 40.386174817657945]
                            ]
                        ]
                }
            ]
    }


@pytest.fixture(scope="function")
def project_extent_geojson_str(project_extent_geojson):
    return json.dumps(project_extent_geojson)
