/*****************************************************************************
 * FILE:    vgetation_types_mwv.js
 * DATE:    Jul 2, 2024
 * AUTHOR:  Yue Sun
 * COPYRIGHT: (c) Aquaveo 2014
 * LICENSE:
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

let read_category_data;
var VEGETATION_TYPES_MWV = (function() {
	// Wrap the library in a package function
	"use strict"; // And enable strict mode for this library

    // elements;
    let $type_list_div, $category_list_div;

    // data
    let vegetation_types_data, classnames, type_item_template, category_item_template;

    classnames = {
        item_div: 'item-div',
        assigned_type_div: 'assigned-type-div',
        original_type: 'original-type'
    }

    type_item_template = `
        <div class="${classnames.item_div}">
            <input type="checkbox" id="{{id}}">
            <label for="{{id}}">{{type_name}}</label>
        </div>
    `

    category_item_template = `
        <div class="${classnames.item_div}{{is-original-type}}">
            <div class="custom-center-align-items">
                <div class="category-div">
                    <input type="radio" id="{{id}}" name="category"/>
                    <label for="{{id}}" class="category-label">{{category}}</label>
                </div>
                <div>
                    <button class="btn icon-btn edit-category-btn"><i class="bi bi-pen"></i></button>
                    <button class="btn icon-btn delete-category-btn"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>
    `

    // helpers
    let safe_id;

    safe_id = function(name) {
        return name.replace(' ', '-');
    }

    // event listeners
    let quick_assign, add_new_type, add_new_category, edit_category, 
        save_category_changes, delete_category, move_types_to_target,
        validate_form;

    quick_assign = function() {
        $($type_list_div).find('input[type="checkbox"]').each(function() {
            let $parent_div = $(this).closest('.' + classnames.item_div).detach();
            let category = $parent_div.find('label').text();
            let id = $(this).attr('id');
            add_new_category(category, id, true);
        })
    }

    add_new_type = function(id, type_name) {
        let new_item = type_item_template.replaceAll('{{id}}', id)
                                         .replace('{{type_name}}', type_name)
        $type_list_div.append(new_item);
    }

    add_new_category = function(category, id, is_original_type=false) {
        let new_item = category_item_template.replace('{{category}}', category)
                                             .replaceAll('{{id}}', safe_id(id))
                                             .replace('{{is-original-type}}', is_original_type ? ` ${classnames.original_type}` : '');
        $category_list_div.append(new_item);
        $('#new-category-input').val('');
    }

    save_category_changes = function($input, $label, $button) {
        $button.html('<i class="bi bi-pen"></i>');
        $label.removeClass('editable');
        const new_category = $label.find('input').val();
        $label.text(new_category);
        $label.attr('for', new_category);
        $input.attr('id', new_category);
    }

    edit_category = function(event) {
        const $item_div = $(event.target).closest('.' + classnames.item_div);
        const $input = $item_div.find('input[type="radio"]');
        const $label = $item_div.find('.category-label');
        const $button = $item_div.find('.edit-category-btn');
        
        // Toggle between editing and saving mode
        if ($label.hasClass('editable')) {
            save_category_changes($input, $label, $button);
        } else {
            $button.html('<i class="bi bi-check-lg"></i>');
            $label.addClass('editable');
            $label.html(`<input type="text" value="${$label.text()}" class="form-control">`);
            $label.find('input').select();

            $label.find('input').on('keypress', function(event) {
                if (event.key == 'Enter') {
                    save_category_changes($(this), $label, $button);
                }
            })
        }
    }

    delete_category = function(event) {
        let $parent_div = $(event.target).closest('.' + classnames.item_div);
        if ($parent_div.hasClass(classnames.original_type)) {
            let id = $parent_div.find('input[type="radio"]').attr('id');
            let category = $parent_div.find('.category-label').text();
            add_new_type(id, category);
        }
        let $types = $parent_div.find('.' + classnames.assigned_type_div);
        if ($types.length > 0) {
            move_types_to_target($types, $type_list_div, classnames.assigned_type_div, classnames.item_div);
        }
        $parent_div.remove();
    }

    move_types_to_target = function($types, $target, current_class, new_class) {
        $types.each(function() {
            const $parent_div = $(this).closest('.' + current_class).detach();
            $target.append($parent_div);
            $(this).prop('checked', false);
            $parent_div.removeClass(current_class);
            $parent_div.addClass(new_class);
        });
    }

    validate_form = function() {
        let unassigned_types = $type_list_div.find('input[type="checkbox"]');
        if (unassigned_types.length > 0) {
            alert("Please assign all vegetation types!");
        } else {
            let categories_data = read_category_data();
            $('#categories').val(JSON.stringify(categories_data));
        }
    }

    read_category_data = function() {
        let categories_data = [];
        $category_list_div.find('.item-div:gt(0)').each(function() {
            let $category_label =  $(this).find('.category-label');
            let category_name =$category_label.text();
            let category_data = {'category': category_name, 'vegetation_types': []};
            let is_original_type = $(this).hasClass('original-type');
            if (is_original_type) {
                category_data.vegetation_types.push({
                    'id': $category_label.attr('for'),
                    'name': $category_label.text()
                })
            }
            $(this).find('.assigned-type-div').each(function() {
                let $type_label = $(this).find('label');
                category_data.vegetation_types.push({
                    'id': $type_label.attr('for'),
                    'name': $type_label.text()
                });
            });
            categories_data.push(category_data);
        })
        return categories_data
    }

    $(function() {
        TETHYS_MAP_VIEW.zoomToExtent($('#extent').data('value'));

        $type_list_div = $('#available-types-div');
        $category_list_div = $('#categories-div');

        vegetation_types_data = $('#vegetation-types').data('value');
        vegetation_types_data.forEach(type => add_new_type(type.VALUE, type.EVT_NAME));

        // create the legend
        let $legend_div = $('#legend-div');
        vegetation_types_data.forEach(function(item) {
            const $legend_item = $('<div>')
                .css({
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '5px'
                });
            const $color_box = $('<div>')
                .css({
                    width: '20px',
                    height: '20px',
                    boxSizing: 'content-box',
                    backgroundColor: item.COLOR,
                    marginRight: '10px',
                    flexShrink: '0' 
                });
            const $label = $('<span>').text(item.EVT_NAME);
            $legend_item.append($color_box).append($label);
            $legend_div.append($legend_item);
        });

        $('#add-btn').on('click', function() {
            let category = $('#new-category-input').val();
            add_new_category(category, category);
        });

        $('#new-category-input').on('keypress', function(event) {
            if (event.key == 'Enter') {
                let category = $(this).val();
                add_new_category(category, category);
            }
        })

        $category_list_div.on('click', '.btn.icon-btn', function(event) {
            if ($(this).hasClass('delete-category-btn')) {
                delete_category(event);
            } else {
                edit_category(event);
            }
        })

        $('#quick-assign-btn').on('click', function() {
            quick_assign();
        })

        $('#assign-btn').on('click', function() {
            const checked_types = $type_list_div.find('input[type="checkbox"]:checked');
            const checked_category = $category_list_div.find('input[type="radio"]:checked');

            if (checked_category.length == 1) {
                const $target_div = checked_category.closest('.' + classnames.item_div);
                move_types_to_target(checked_types, $target_div, classnames.item_div, classnames.assigned_type_div);
            } else {
                alert("Please select a category!");
            }
        });

        $('#remove-btn').on('click', function() {
            const checked_types = $category_list_div.find('input[type="checkbox"]:checked');
            if (checked_types.length >= 1) {
                move_types_to_target(checked_types, $type_list_div, classnames.assigned_type_div, classnames.item_div);
            }
        });

        $('.btn-next').on('click', () => validate_form());
    })
}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.