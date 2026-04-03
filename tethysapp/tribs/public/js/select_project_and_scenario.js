var TRIBS_DATASETS = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
    *                      MODULE LEVEL / GLOBAL VARIABLES
    *************************************************************************/
    var m_projects_and_scenarios;

    var public_interface;

    // Selector Variables
    var m_project,
        m_scenario;

    /************************************************************************
    *                    PRIVATE FUNCTION DECLARATIONS
    *************************************************************************/
    // Dataset Select Methods
    var bind_controls, update_scenario_options, collect_data;

    /************************************************************************
    *                    PRIVATE FUNCTION IMPLEMENTATIONS
    *************************************************************************/
    // Dataset Select Methods
    bind_controls = function() {

        $('#select_project').on('change', function() {
            let project = $('#select_project').val();

            if (project !== m_project) {
                m_project = project;
                // Update the scenario options when project changes
                update_scenario_options();
            }
        });

    };

    update_scenario_options = function() {
        // Clear select_scenario options
        $('#select_scenario').select2().empty();

        // Set the scenario Options
        $('#select_scenario').append(new Option('None', '', true, true));
        for (var scenario in m_projects_and_scenarios[m_project]) {
            let scenario_id = scenario;
            let scenario_name = m_projects_and_scenarios[m_project][scenario];
            let new_option = new Option(scenario_name, scenario_id, false, false);
            $('#select_scenario').append(new_option);
        }
    };

    collect_data = function() {
        let data = {
            project: m_project,
            scenario: m_scenario,
        };
        return data;
    };

    /************************************************************************
    *                            PUBLIC INTERFACE
    *************************************************************************/
    public_interface = {};

    /************************************************************************
    *                  INITIALIZATION / CONSTRUCTOR
    *************************************************************************/
    $(function() {
        // Initialize Global Variables
        bind_controls();

        // Initialize Constants
        m_projects_and_scenarios = $('#projects-and-scenarios').data('projects-and-scenarios');

        // Initialize members
        m_project = $('#select_project').val();
        m_scenario = $('#select_scenario').val();
    });

    return public_interface;

}()); // End of package wrapper