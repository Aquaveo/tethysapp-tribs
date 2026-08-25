/*****************************************************************************
 * FILE:    select_point_mwv.js
 * DATE:    August 24, 2026
 * AUTHOR:  Yue Sun
 * COPYRIGHT: (c) Aquaveo 2026
 *****************************************************************************/

var SELECT_POINT_MWV = (function() {
    "use strict";

    /************************************************************************
    *                      MODULE LEVEL / GLOBAL VARIABLES
    *************************************************************************/
    var m_public_interface;

    var m_map,                  // ol.Map
        m_raster_layer,         // Input raster TileWMS layer
        m_tooltip_element,      // Tooltip DOM element
        m_tooltip_overlay,      // ol.Overlay wrapping the tooltip
        m_query_timeout,        // Debounce timeout handle
        m_request_counter = 0;  // Guards against out-of-order responses

    var QUERY_DEBOUNCE_MS = 75;
    var NO_DATA_THRESHOLD = -1e30;  // Values below this are treated as no-data (e.g. -3.4e+38)

    /************************************************************************
    *                    PRIVATE FUNCTION DECLARATIONS
    *************************************************************************/
    var find_raster_layer, init_tooltip, hide_tooltip, query_raster_value, on_pointer_move;

    find_raster_layer = function() {
        let raster_layer = null;
        m_map.getLayers().forEach(function(layer) {
            if (layer.tethys_data && layer.tethys_data.layer_id === 'input-raster') {
                raster_layer = layer;
            }
        });
        return raster_layer;
    };

    init_tooltip = function() {
        m_tooltip_element = document.createElement('div');
        m_tooltip_element.className = 'raster-value-tooltip';
        m_tooltip_overlay = new ol.Overlay({
            element: m_tooltip_element,
            offset: [14, 0],
            positioning: 'center-left',
            stopEvent: false,
        });
        m_map.addOverlay(m_tooltip_overlay);
    };

    hide_tooltip = function() {
        m_tooltip_overlay.setPosition(undefined);
    };

    query_raster_value = function(coordinate) {
        let view = m_map.getView();
        let url = m_raster_layer.getSource().getFeatureInfoUrl(
            coordinate,
            view.getResolution(),
            view.getProjection(),
            {'INFO_FORMAT': 'application/json'}
        );

        if (!url) {
            hide_tooltip();
            return;
        }

        let request_id = ++m_request_counter;

        fetch(url)
            .then((response) => response.json())
            .then(function(data) {
                // Ignore responses that arrive out of order
                if (request_id !== m_request_counter) { return; }

                let features = data.features || [];
                if (!features.length) {
                    hide_tooltip();
                    return;
                }

                let value = features[0].properties.GRAY_INDEX;
                if (value === null || value === undefined || value < NO_DATA_THRESHOLD) {
                    hide_tooltip();
                    return;
                }

                m_tooltip_element.innerHTML = 'Value: ' + value.toFixed(2);
                m_tooltip_overlay.setPosition(coordinate);
            })
            .catch(function() {
                hide_tooltip();
            });
    };

    on_pointer_move = function(evt) {
        if (evt.dragging || !m_raster_layer.getVisible()) {
            hide_tooltip();
            return;
        }

        // Debounce the GetFeatureInfo requests while the mouse is moving
        clearTimeout(m_query_timeout);
        m_query_timeout = setTimeout(function() {
            query_raster_value(evt.coordinate);
        }, QUERY_DEBOUNCE_MS);
    };

    /************************************************************************
    *                        DEFINE PUBLIC INTERFACE
    *************************************************************************/
    m_public_interface = {};

    /************************************************************************
    *                  INITIALIZATION / CONSTRUCTOR
    *************************************************************************/
    $(function() {
        m_map = TETHYS_MAP_VIEW.getMap();
        m_raster_layer = find_raster_layer();

        if (!m_raster_layer) {
            return;
        }

        init_tooltip();
        m_map.on('pointermove', on_pointer_move);
        m_map.getViewport().addEventListener('mouseout', function() {
            clearTimeout(m_query_timeout);
            hide_tooltip();
        });
    });

    return m_public_interface;

}()); // End of package wrapper
