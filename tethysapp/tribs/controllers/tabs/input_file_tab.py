"""
********************************************************************************
* Name: input_file_tab.py
* Created On: Oct 25, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from tethysext.atcore.controllers.resources import ResourceTab
from django.shortcuts import reverse
from tribs_adapter.resources.dataset import Dataset


class InputfileTab(ResourceTab):
    template_name = 'tribs/tabs/input_file_tab.html'

    def get_context(self, request, session, resource, context, *args, **kwargs):
        """
        Build context for the ResourceSummaryTab template that is used to generate the tab content.
        """
        input_file = self.get_input_file(request, session, resource)

        # Run Parameters
        run_time_variables_name = 'Time Variables'
        run_time_variables_dict = self.dump_time_variables(input_file.run_parameters.time_variables)
        run_time_variables_table = (run_time_variables_name, run_time_variables_dict)

        run_routing_variables_name = 'Routing Variables'
        run_routing_variables_dict = self.dump_run_routing_variables_with_enums(
            session, input_file.run_parameters.routing_variables
        )
        run_routing_variables_table = (run_routing_variables_name, run_routing_variables_dict)

        run_meteorological_variables_name = 'Meteorological Variables'
        run_meteorological_variables_dict = self.dump_meteorological_variables(
            input_file.run_parameters.meteorological_variables
        )
        run_meteorological_variables_table = (run_meteorological_variables_name, run_meteorological_variables_dict)

        context['run_param_data'] = [
            [run_time_variables_table, run_routing_variables_table, run_meteorological_variables_table]
        ]

        # Run Options
        run_options_name = 'Run Options'
        run_options_dict = self.dump_options_with_enums(input_file.run_options)
        run_options_table = (run_options_name, run_options_dict)

        context['run_options_data'] = [[run_options_table]]

        # Mode
        mode_rainfall_name = 'Rainfall Forecasting'
        mode_rainfall_dict = self.dump_rainfall_forecast_with_enums(session, input_file.modes.rainfall_forecasting)
        mode_rainfall_table = (mode_rainfall_name, mode_rainfall_dict)

        mode_stochastic_name = 'Stochastic Climate Forcing'
        mode_stochastic_dict = self.dump_stochastic_climate_forcing_with_enums(
            session, input_file.modes.stochastic_climate_forcing
        )
        mode_stochastic_table = (mode_stochastic_name, mode_stochastic_dict)

        mode_restart_name = 'Restart'
        mode_restart_dict = self.dump_restart_with_enums(session, input_file.modes.restart)
        mode_restart_table = (mode_restart_name, mode_restart_dict)

        mode_parallel_name = 'Parallel'
        mode_parallel_dict = self.dump_parallel_with_enums(session, input_file.modes.parallel)
        mode_parallel_table = (mode_parallel_name, mode_parallel_dict)

        context['mode_data'] = [[mode_rainfall_table, mode_stochastic_table, mode_restart_table, mode_parallel_table]]

        # visualization
        visualization_name = 'Visualization'
        visualization_dict = {}
        visualization_dict['OPTVIZ'] = self.get_formated_enum_string(input_file.visualization.OPTVIZ)
        id = input_file.visualization.OUTVIZFILENAME.resource_id
        visualization_dict['OUTVIZFILENAME'] = self.get_html_for_dataset(session, id)
        visualization_table = (visualization_name, visualization_dict)

        context['viz_data'] = [[visualization_table]]

        # files and pathnames
        # Mesh Generation
        mesh_generation_name = 'Mesh Generation'
        mesh_generation_dict = {}

        mesh_generation_dict = self.dump_mesh_generation(session, input_file.files_and_pathnames.mesh_generation)

        mesh_generation_table = (mesh_generation_name, mesh_generation_dict)

        # Resampling Grids
        resampling_grids_name = 'Resampling Grids'
        resampling_grids_dict = {}

        resampling_grids_dict = self.dump_resampling_grids(session, input_file.files_and_pathnames.resampling_grids)

        resampling_grids_table = (resampling_grids_name, resampling_grids_dict)

        # Meterological data
        meteorological_data_name = 'Meterological data'
        meteorological_data_dict = {}

        meteorological_data_dict = self.dump_meterological_data(
            session, input_file.files_and_pathnames.meteorological_data
        )

        meteorological_data_table = (meteorological_data_name, meteorological_data_dict)

        # Output data
        output_data_name = 'Output data'
        output_data_dict = {}

        output_data_dict = self.dump_output_data(session, input_file.files_and_pathnames.output_data)

        output_data_table = (output_data_name, output_data_dict)

        # Reservoir data
        reservoir_data_name = 'Reservoir data'
        reservoir_data_dict = {}

        reservoir_data_dict = self.dump_reservoir_data(session, input_file.files_and_pathnames.reservoir_data)

        reservoir_data_table = (reservoir_data_name, reservoir_data_dict)

        context['files_data'] = [
            [
                mesh_generation_table, resampling_grids_table, meteorological_data_table, output_data_table,
                reservoir_data_table
            ]
        ]

        return context

    def get_dataset_name(self, session, id):
        dataset = session.query(Dataset).get(id) if id is not None else None
        dataset_name = dataset.name if dataset else None
        return dataset_name

    def get_html_for_dataset(self, session, id):
        dataset_name = self.get_dataset_name(session, id)
        if dataset_name is None:
            return ""
        else:
            return f'<a href="{reverse("tribs:tribs_dataset_details_tab", args=[id, "summary"])}"> {dataset_name}</a>'

    def get_formated_enum_string(self, enum):
        return f'{enum.name.title()} ({enum.value})'

    def get_formated_float_string(self, var):
        if var is None:
            return ""
        else:
            return str(var)

    def dump_options_with_enums(self, run_options):
        data_dict = {}

        data_dict['OPTMESHINPUT'] = self.get_formated_enum_string(run_options.OPTMESHINPUT)
        data_dict['RAINSOURCE'] = self.get_formated_enum_string(run_options.RAINSOURCE)
        data_dict['OPTEVAPOTRANS'] = self.get_formated_enum_string(run_options.OPTEVAPOTRANS)
        data_dict['OPTSNOW'] = self.get_formated_enum_string(run_options.OPTSNOW)
        data_dict['HILLALBOPT'] = self.get_formated_enum_string(run_options.HILLALBOPT)
        data_dict['OPTRADSHELT'] = self.get_formated_enum_string(run_options.OPTRADSHELT)
        data_dict['OPTINTERCEPT'] = self.get_formated_enum_string(run_options.OPTINTERCEPT)
        data_dict['OPTLANDUSE'] = self.get_formated_enum_string(run_options.OPTLANDUSE)
        data_dict['OPTLUINTERP'] = self.get_formated_enum_string(run_options.OPTLUINTERP)
        data_dict['GFLUXOPTION'] = self.get_formated_enum_string(run_options.GFLUXOPTION)
        data_dict['METDATAOPTION'] = self.get_formated_enum_string(run_options.METDATAOPTION)
        data_dict['CONVERTDATA'] = self.get_formated_enum_string(run_options.CONVERTDATA)
        data_dict['OPTBEDROCK'] = self.get_formated_enum_string(run_options.OPTBEDROCK)
        data_dict['OPTGROUNDWATER'] = self.get_formated_enum_string(run_options.OPTGROUNDWATER)
        data_dict['WIDTHINTERPOLATION'] = self.get_formated_enum_string(run_options.WIDTHINTERPOLATION)
        data_dict['OPTGWFILE'] = self.get_formated_enum_string(run_options.OPTGWFILE)
        data_dict['OPTRUNON'] = self.get_formated_enum_string(run_options.OPTRUNON)
        data_dict['OPTRESERVOIR'] = self.get_formated_enum_string(run_options.OPTRESERVOIR)
        data_dict['OPTSOILTYPE'] = self.get_formated_enum_string(run_options.OPTSOILTYPE)
        data_dict['OPTPERCOLATION'] = self.get_formated_enum_string(run_options.OPTPERCOLATION)

        return data_dict

    def dump_rainfall_forecast_with_enums(self, session, rainfall_forecast):
        data_dict = {}

        data_dict['FORECASTMODE'] = self.get_formated_enum_string(rainfall_forecast.FORECASTMODE)
        data_dict['FORECASTTIME'] = self.get_formated_float_string(rainfall_forecast.FORECASTTIME)
        data_dict['FORECASTLEADTIME'] = self.get_formated_float_string(rainfall_forecast.FORECASTLEADTIME)
        data_dict['FORECASTLENGTH'] = self.get_formated_float_string(rainfall_forecast.FORECASTLENGTH)
        id = rainfall_forecast.FORECASTFILE.resource_id
        data_dict['FORECASTFILE'] = self.get_html_for_dataset(session, id)
        data_dict['CLIMATOLOGY'] = self.get_formated_float_string(rainfall_forecast.CLIMATOLOGY)
        data_dict['RAINDISTRIBUTION'] = self.get_formated_enum_string(rainfall_forecast.RAINDISTRIBUTION)

        return data_dict

    def dump_stochastic_climate_forcing_with_enums(self, session, rainfall_forecast):
        data_dict = {}

        data_dict['STOCHASTICMODE'] = self.get_formated_enum_string(rainfall_forecast.STOCHASTICMODE)
        data_dict['PMEAN'] = self.get_formated_float_string(rainfall_forecast.PMEAN)
        data_dict['STDUR'] = self.get_formated_float_string(rainfall_forecast.STDUR)
        data_dict['ISTDUR'] = self.get_formated_float_string(rainfall_forecast.ISTDUR)
        data_dict['SEED'] = self.get_formated_float_string(rainfall_forecast.SEED)
        data_dict['PERIOD'] = self.get_formated_float_string(rainfall_forecast.PERIOD)
        data_dict['MAXPMEAN'] = self.get_formated_float_string(rainfall_forecast.MAXPMEAN)
        data_dict['MAXSTDURMN'] = self.get_formated_float_string(rainfall_forecast.MAXSTDURMN)
        data_dict['MAXISTDURMN'] = self.get_formated_float_string(rainfall_forecast.MAXISTDURMN)

        id = rainfall_forecast.WEATHERTABLENAME.resource_id
        data_dict['WEATHERTABLENAME'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_restart_with_enums(self, session, restart):
        data_dict = {}

        data_dict['RESTARTMODE'] = self.get_formated_enum_string(restart.RESTARTMODE)
        data_dict['RESTARTINTRVL'] = self.get_formated_float_string(restart.RESTARTINTRVL)

        id = restart.RESTARTDIR.resource_id
        data_dict['RESTARTDIR'] = self.get_html_for_dataset(session, id)

        id = restart.RESTARTFILE.resource_id
        data_dict['RESTARTFILE'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_parallel_with_enums(self, session, restart):
        data_dict = {}

        data_dict['PARALLELMODE'] = self.get_formated_enum_string(restart.PARALLELMODE)
        data_dict['GRAPHOPTION'] = self.get_formated_enum_string(restart.GRAPHOPTION)

        id = restart.GRAPHFILE.resource_id
        data_dict['GRAPHFILE'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_run_routing_variables_with_enums(self, session, routing_variables):
        data_dict = {}

        data_dict['BASEFLOW'] = self.get_formated_float_string(routing_variables.BASEFLOW)
        data_dict['VELOCITYCOEF'] = self.get_formated_float_string(routing_variables.VELOCITYCOEF)
        data_dict['VELOCITYRATIO'] = self.get_formated_float_string(routing_variables.VELOCITYRATIO)
        data_dict['KINEMVELCOEF'] = self.get_formated_float_string(routing_variables.KINEMVELCOEF)
        data_dict['FLOWEXP'] = self.get_formated_float_string(routing_variables.FLOWEXP)
        data_dict['CHANNELROUGHNESS'] = self.get_formated_float_string(routing_variables.CHANNELROUGHNESS)
        data_dict['CHANNELWIDTH'] = self.get_formated_float_string(routing_variables.CHANNELWIDTH)
        data_dict['CHANNELWIDTHCOEFF'] = self.get_formated_float_string(routing_variables.CHANNELWIDTHCOEFF)
        data_dict['CHANNELWIDTHEXPNT'] = self.get_formated_float_string(routing_variables.CHANNELWIDTHEXPNT)

        id = routing_variables.CHANNELWIDTHFILE.resource_id
        data_dict['CHANNELWIDTHFILE'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_mesh_generation(self, session, mesh_variables):
        data_dict = {}

        id = mesh_variables.INPUTDATAFILE.resource_id
        data_dict['INPUTDATAFILE'] = self.get_html_for_dataset(session, id)

        id = mesh_variables.POINTFILENAME.resource_id
        data_dict['POINTFILENAME'] = self.get_html_for_dataset(session, id)

        data_dict['INPUTTIME'] = mesh_variables.INPUTTIME

        id = mesh_variables.ARCINFOFILENAME.resource_id
        data_dict['ARCINFOFILENAME'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_resampling_grids(self, session, resampling_grids_variable):
        data_dict = {}

        id = resampling_grids_variable.SOILTABLENAME.resource_id
        data_dict['SOILTABLENAME'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.SOILMAPNAME.resource_id
        data_dict['SOILMAPNAME'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.LANDTABLENAME.resource_id
        data_dict['LANDTABLENAME'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.LANDMAPNAME.resource_id
        data_dict['LANDMAPNAME'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.GWATERFILE.resource_id
        data_dict['GWATERFILE'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.DEMFILE.resource_id
        data_dict['DEMFILE'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.RAINFILE.resource_id
        data_dict['RAINFILE'] = self.get_html_for_dataset(session, id)

        data_dict['RAINEXTENSION'] = resampling_grids_variable.RAINEXTENSION

        data_dict['DEPTHTOBEDROCK'] = resampling_grids_variable.DEPTHTOBEDROCK

        id = resampling_grids_variable.BEDROCKFILE.resource_id
        data_dict['BEDROCKFILE'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.LUGRID.resource_id
        data_dict['LUGRID'] = self.get_html_for_dataset(session, id)

        id = resampling_grids_variable.SCGRID.resource_id
        data_dict['SCGRID'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_meterological_data(self, session, meteorological_data_variable):
        data_dict = {}

        id = meteorological_data_variable.HYDROMETSTATIONS.resource_id
        data_dict['HYDROMETSTATIONS'] = self.get_html_for_dataset(session, id)

        id = meteorological_data_variable.HYDROMETGRID.resource_id
        data_dict['HYDROMETGRID'] = self.get_html_for_dataset(session, id)

        id = meteorological_data_variable.HYDROMETCONVERT.resource_id
        data_dict['HYDROMETCONVERT'] = self.get_html_for_dataset(session, id)

        id = meteorological_data_variable.HYDROMETBASENAME.resource_id
        data_dict['HYDROMETBASENAME'] = self.get_html_for_dataset(session, id)

        id = meteorological_data_variable.GAUGESTATIONS.resource_id
        data_dict['GAUGESTATIONS'] = self.get_html_for_dataset(session, id)

        id = meteorological_data_variable.GAUGECONVERT.resource_id
        data_dict['GAUGECONVERT'] = self.get_html_for_dataset(session, id)

        id = meteorological_data_variable.GAUGEBASENAME.resource_id
        data_dict['GAUGEBASENAME'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_output_data(self, session, output_data_variable):
        data_dict = {}

        # These items have a list of datasets
        outfilename_txt = ''
        count = 0
        for file_database_path in output_data_variable.OUTFILENAME.file_database_paths:
            if count != 0:
                outfilename_txt += ", "
            id = file_database_path.resource_id
            outfilename_txt += (self.get_html_for_dataset(session, id))
            count += 1
        data_dict['OUTFILENAME'] = outfilename_txt

        # These items have a list of datasets
        outfilename_txt = ''
        count = 0
        for file_database_path in output_data_variable.OUTHYDROFILENAME.file_database_paths:
            if count != 0:
                outfilename_txt += ", "
            id = file_database_path.resource_id
            outfilename_txt += (self.get_html_for_dataset(session, id))
            count += 1
        data_dict['OUTHYDROFILENAME'] = outfilename_txt

        data_dict['OUTHYDROEXTENSION'] = output_data_variable.OUTHYDROEXTENSION

        data_dict['RIBSHYDOUTPUT'] = output_data_variable.RIBSHYDOUTPUT

        id = output_data_variable.NODEOUTPUTLIST.resource_id
        data_dict['NODEOUTPUTLIST'] = self.get_html_for_dataset(session, id)

        id = output_data_variable.HYDRONODELIST.resource_id
        data_dict['HYDRONODELIST'] = self.get_html_for_dataset(session, id)

        id = output_data_variable.OUTLETNODELIST.resource_id
        data_dict['OUTLETNODELIST'] = self.get_html_for_dataset(session, id)

        data_dict['OPTSPATIAL'] = self.get_formated_enum_string(output_data_variable.OPTSPATIAL)
        data_dict['OPTINTERHYDRO'] = self.get_formated_enum_string(output_data_variable.OPTINTERHYDRO)
        data_dict['OPTHEADER'] = self.get_formated_enum_string(output_data_variable.OPTHEADER)

        return data_dict

    def dump_reservoir_data(self, session, reservoir_data_variable):
        data_dict = {}

        id = reservoir_data_variable.RESPOLYGONID.resource_id
        data_dict['RESPOLYGONID'] = self.get_html_for_dataset(session, id)

        id = reservoir_data_variable.RESDATA.resource_id
        data_dict['RESDATA'] = self.get_html_for_dataset(session, id)

        return data_dict

    def dump_time_variables(self, time_variables):
        data_dict = {}

        for time_variable in time_variables:
            data_dict[time_variable[0]] = self.get_formated_float_string(time_variable[1])

        return data_dict

    def dump_meteorological_variables(self, meteorological_variables):
        data_dict = {}

        for meteorological_variable in meteorological_variables:
            data_dict[meteorological_variable[0]] = self.get_formated_float_string(meteorological_variable[1])

        return data_dict
