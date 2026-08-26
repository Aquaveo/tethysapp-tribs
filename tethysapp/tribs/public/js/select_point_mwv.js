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
    var find_raster_layer, find_drawing_layer, init_tooltip, hide_tooltip, query_raster_value,
        on_pointer_move, enforce_draw_extent, show_draw_warning, init_drawing_layer_toggle,
        update_drawing_layer_item;

    find_raster_layer = function() {
        let raster_layer = null;
        m_map.getLayers().forEach(function(layer) {
            if (layer.tethys_data && layer.tethys_data.layer_id === 'input-raster') {
                raster_layer = layer;
            }
        });
        return raster_layer;
    };

    find_drawing_layer = function() {
        let drawing_layer = null;
        m_map.getLayers().forEach(function(layer) {
            if (layer.tethys_data && layer.tethys_data.layer_id === 'drawing_layer') {
                drawing_layer = layer;
            }
        });
        return drawing_layer;
    };

    update_drawing_layer_item = function(drawing_layer) {
        let $row = $('.layer-visibility-control[data-layer-id="drawing_layer"]').closest('.layer-list-item');

        if (!$row.length) {
            return;
        }

        let features = drawing_layer.getSource().getFeatures();

        // Only show the row while a point exists
        if (!features.length) {
            $row.hide();
            return;
        }

        // Label the row with the user-given point name
        let point_name = features[0].get('point_name');
        $row.find('.display-name').text(point_name ? point_name : 'Point');
        $row.show();
    };

    init_drawing_layer_toggle = function() {
        // Bind the tree-only drawing layer row (added by SelectPointMWV) to the
        // map gizmo's drawing layer, which atcore does not manage for this row.
        let drawing_layer = find_drawing_layer();

        if (!drawing_layer) {
            return;
        }

        $('.layer-visibility-control[data-layer-id="drawing_layer"]').on('change', function() {
            drawing_layer.setVisible(this.checked);
        });

        // Repurpose the row's Remove/Rename actions to operate on the drawn feature.
        // atcore's default handlers act on the layer itself, which would remove the
        // gizmo's drawing layer from the map and break drawing — .off() unbinds them.
        let $row = $('.layer-visibility-control[data-layer-id="drawing_layer"]').closest('.layer-list-item');

        $row.find('.remove-action').off('click').on('click', function() {
            let source = drawing_layer.getSource();
            let features = source.getFeatures();

            if (features.length && confirm('Are you sure you want to remove this point?')) {
                features.forEach(function(feature) { source.removeFeature(feature); });
            }
            return false;
        });

        $row.find('.rename-action').off('click').on('click', function() {
            let features = drawing_layer.getSource().getFeatures();

            if (!features.length) {
                return false;
            }

            let feature = features[0];
            let current_name = feature.get('point_name') || '';
            let new_name = prompt('Enter a name for the point:', current_name);

            if (new_name !== null && new_name.trim() !== '') {
                feature.set('point_name', new_name.trim());
            }
            return false;
        });

        // Keep the row's visibility and label in sync with the drawn point
        let refresh = function() { update_drawing_layer_item(drawing_layer); };
        let source = drawing_layer.getSource();

        source.getFeatures().forEach(function(feature) {
            feature.on('propertychange', refresh);
        });
        source.on('addfeature', function(evt) {
            evt.feature.on('propertychange', refresh);
            refresh();
        });
        source.on('removefeature', refresh);
        refresh();
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

    show_draw_warning = function(message) {
        let $warning = $('<div class="draw-extent-warning"></div>').text(message);
        $(m_map.getTargetElement()).append($warning);
        setTimeout(function() {
            $warning.fadeOut(400, function() { $warning.remove(); });
        }, 3000);
    };

    enforce_draw_extent = function() {
        // The controller sets the map extent to the input raster extent (EPSG:4326)
        let extent_4326 = $('#atcore-map-attributes').data('map-extent');

        if (!extent_4326 || extent_4326.length !== 4) {
            return;
        }

        let raster_extent = ol.proj.transformExtent(
            extent_4326, 'EPSG:4326', m_map.getView().getProjection()
        );

        // Allow a small tolerance (1% of the larger dimension) so edge clicks are not rejected
        let tolerance = 0.01 * Math.max(
            ol.extent.getWidth(raster_extent), ol.extent.getHeight(raster_extent)
        );
        raster_extent = ol.extent.buffer(raster_extent, tolerance);

        let drawing_layer = find_drawing_layer();

        if (!drawing_layer) {
            return;
        }

        // Reject features drawn outside the raster extent
        let source = drawing_layer.getSource();
        source.on('addfeature', function(evt) {
            let feature_extent = evt.feature.getGeometry().getExtent();
            if (!ol.extent.containsExtent(raster_extent, feature_extent)) {
                // Defer removal so the source is not modified during the addfeature event
                setTimeout(function() {
                    source.removeFeature(evt.feature);
                    show_draw_warning('The point must be located within the input raster.');
                }, 0);
            }
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

        enforce_draw_extent();
        init_drawing_layer_toggle();
        init_tooltip();
        m_map.on('pointermove', on_pointer_move);
        m_map.getViewport().addEventListener('mouseout', function() {
            clearTimeout(m_query_timeout);
            hide_tooltip();
        });
    });

    return m_public_interface;

}()); // End of package wrapper
