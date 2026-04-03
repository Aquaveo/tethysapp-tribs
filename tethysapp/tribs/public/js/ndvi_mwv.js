/*****************************************************************************
 * FILE:    vgetation_types_mwv.js
 * DATE:    Jun 11, 2024
 * AUTHOR:  Yue Sun
 * COPYRIGHT: (c) Aquaveo 2014
 * LICENSE:
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var NDVI_MWV = (function() {
	// Wrap the library in a package function
	"use strict"; // And enable strict mode for this library

    let map, ndvi_layer, ndvi_max;

    function update_ndvi_layer(ndvi_threshold) {
        ndvi_layer.getSource().updateParams(
            {ENV: `ndvi_threshold:${ndvi_threshold};ndvi_max:${ndvi_max};earth_opacity:0`}
        );
    }

    $(function() {
        TETHYS_MAP_VIEW.zoomToExtent($('#extent').data('value'));
        map = TETHYS_MAP_VIEW.getMap();
        let layers = map.getLayers().getArray();
        layers.forEach(function(layer) {
            if (layer['tethys_legend_title'] == 'NDVI Layer') {
                ndvi_layer = layer;
            }
        })

        ndvi_max = $('#ndvi-max').data('value');
        $('#ndvi-threshold-slider').on('change', function() {
            $('#ndvi-threshold-text').val($(this).val());
            $('#ndvi-threshold-slider-text').text($(this).val());
            update_ndvi_layer($(this).val());
        });

        $('#ndvi-threshold-text').on('keydown', function(event) {
            if (event.key === 'Enter') {
                let value = $(this).val();
                if (value < 0 || value > 1) {
                    alert("the naip threshold has to be between 0 and 1!");
                    $(this).val('');
                } else {
                    $('#ndvi-threshold-slider').val(value);
                    $('#ndvi-threshold-slider-text').text($(this).val());
                    update_ndvi_layer(value);
                }
            }
        })
    })
}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.