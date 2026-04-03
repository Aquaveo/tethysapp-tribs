const DEFAULT_TIME = new Date();

function parseDate(dateString) {
  return isNaN(Date.parse(dateString)) ? DEFAULT_TIME : new Date(Date.parse(dateString));
}

function getFileStructure(object_path) {
  return {
    resource_id: object_path?.resource_id ?? null,
    file_collection_id: object_path?.file_collection_id,
    file_collection_paths: object_path?.file_collection_paths,
    path: object_path?.path,
    file: null,
  }
}

export const ModelControlInitialValues = (ms) => {
  return(
    {
      id: ms.id,
      attributes: ms.attributes,
      created_by: ms.created_by,
      date_created: parseDate(ms.date_created),
      description: ms.description,
      display_type_plural: ms.display_type_plural,
      display_type_singular: ms.display_type_singular,
      locked: ms.locked,
      name: ms.name,
      organizations: ms.organizations,
      public: ms.public,
      slug: ms.slug,
      status: ms.status,
      type: ms.type,
      input_file: {
        file_name: ms.input_file?.file_name,
        run_parameters: {
          time_variables: {
            STARTDATE: parseDate(ms.input_file?.run_parameters?.time_variables?.STARTDATE),
            RUNTIME: ms.input_file?.run_parameters?.time_variables?.RUNTIME,
            TIMESTEP: ms.input_file?.run_parameters?.time_variables?.TIMESTEP,
            GWSTEP: ms.input_file?.run_parameters?.time_variables?.GWSTEP,
            METSTEP: ms.input_file?.run_parameters?.time_variables?.METSTEP,
            ETISTEP: ms.input_file?.run_parameters?.time_variables?.ETISTEP,
            RAININTRVL: ms.input_file?.run_parameters?.time_variables?.RAININTRVL,
            OPINTRVL: ms.input_file?.run_parameters?.time_variables?.OPINTRVL,
            SPOPINTRVL: ms.input_file?.run_parameters?.time_variables?.SPOPINTRVL,
            INTSTORMMAX: ms.input_file?.run_parameters?.time_variables?.INTSTORMMAX,
            RAINSEARCH: ms.input_file?.run_parameters?.time_variables?.RAINSEARCH
          },
          routing_variables: {
            BASEFLOW: ms.input_file?.run_parameters?.routing_variables?.BASEFLOW,
            VELOCITYCOEF: ms.input_file?.run_parameters?.routing_variables?.VELOCITYCOEF,
            VELOCITYRATIO: ms.input_file?.run_parameters?.routing_variables?.VELOCITYRATIO,
            KINEMVELCOEF: ms.input_file?.run_parameters?.routing_variables?.KINEMVELCOEF,
            FLOWEXP: ms.input_file?.run_parameters?.routing_variables?.FLOWEXP,
            CHANNELROUGHNESS: ms.input_file?.run_parameters?.routing_variables?.CHANNELROUGHNESS,
            CHANNELWIDTH: ms.input_file?.run_parameters?.routing_variables?.CHANNELWIDTH,
            CHANNELWIDTHCOEFF: ms.input_file?.run_parameters?.routing_variables?.CHANNELWIDTHCOEFF,
            CHANNELWIDTHEXPNT: ms.input_file?.run_parameters?.routing_variables?.CHANNELWIDTHEXPNT,
            CHANNELWIDTHFILE: getFileStructure(ms.input_file?.run_parameters?.routing_variables?.CHANNELWIDTHFILE)
          },
          meteorological_variables: {
            TLINKE: ms.input_file?.run_parameters?.meteorological_variables?.TLINKE,
            MINSNTEMP: ms.input_file?.run_parameters?.meteorological_variables?.MINSNTEMP,
            TEMPLAPSE: ms.input_file?.run_parameters?.meteorological_variables?.TEMPLAPSE,
            PRECLAPSE: ms.input_file?.run_parameters?.meteorological_variables?.PRECLAPSE,
            SNLIQFRAC: ms.input_file?.run_parameters?.meteorological_variables?.SNLIQFRAC
          }
        },
        run_options: {
          OPTMESHINPUT: ms.input_file?.run_options?.OPTMESHINPUT,
          RAINSOURCE: ms.input_file?.run_options?.RAINSOURCE,
          OPTEVAPOTRANS: ms.input_file?.run_options?.OPTEVAPOTRANS,
          OPTSNOW: ms.input_file?.run_options?.OPTSNOW,
          HILLALBOPT: ms.input_file?.run_options?.HILLALBOPT,
          OPTRADSHELT: ms.input_file?.run_options?.OPTRADSHELT,
          OPTINTERCEPT: ms.input_file?.run_options?.OPTINTERCEPT,
          OPTLANDUSE: ms.input_file?.run_options?.OPTLANDUSE,
          OPTLUINTERP: ms.input_file?.run_options?.OPTLUINTERP,
          GFLUXOPTION: ms.input_file?.run_options?.GFLUXOPTION,
          METDATAOPTION: ms.input_file?.run_options?.METDATAOPTION,
          CONVERTDATA: ms.input_file?.run_options?.CONVERTDATA,
          OPTBEDROCK: ms.input_file?.run_options?.OPTBEDROCK,
          OPTGROUNDWATER: ms.input_file?.run_options?.OPTGROUNDWATER,
          WIDTHINTERPOLATION: ms.input_file?.run_options?.WIDTHINTERPOLATION,
          OPTGWFILE: ms.input_file?.run_options?.OPTGWFILE,
          OPTRUNON: ms.input_file?.run_options?.OPTRUNON,
          OPTRESERVOIR: ms.input_file?.run_options?.OPTRESERVOIR,
          OPTSOILTYPE: ms.input_file?.run_options?.OPTSOILTYPE,
          OPTPERCOLATION: ms.input_file?.run_options?.OPTPERCOLATION
        },
        files_and_pathnames: {
          mesh_generation: {
            INPUTDATAFILE: getFileStructure(ms.input_file?.files_and_pathnames?.mesh_generation?.INPUTDATAFILE),
            POINTFILENAME: getFileStructure(ms.input_file?.files_and_pathnames?.mesh_generation?.POINTFILENAME),
            INPUTTIME:
              ms.input_file?.files_and_pathnames?.mesh_generation?.INPUTTIME,
            ARCINFOFILENAME: getFileStructure(ms.input_file?.files_and_pathnames?.mesh_generation?.ARCINFOFILENAME)
          },
          resampling_grids: {
            SOILTABLENAME: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.SOILTABLENAME),
            SOILMAPNAME: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.SOILMAPNAME),
            LANDTABLENAME: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.LANDTABLENAME),
            LANDMAPNAME: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.LANDMAPNAME),
            GWATERFILE: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.GWATERFILE),
            DEMFILE: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.DEMFILE),
            RAINFILE: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.RAINFILE),
            RAINEXTENSION: ms.input_file?.files_and_pathnames?.resampling_grids?.RAINEXTENSION,
            DEPTHTOBEDROCK: ms.input_file?.files_and_pathnames?.resampling_grids?.DEPTHTOBEDROCK,
            BEDROCKFILE: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.BEDROCKFILE),
            LUGRID: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.LUGRID),
            SCGRID: getFileStructure(ms.input_file?.files_and_pathnames?.resampling_grids?.SCGRID),
          },
          meteorological_data: {
            HYDROMETSTATIONS: getFileStructure(ms.input_file?.files_and_pathnames?.meteorological_data?.HYDROMETSTATIONS),
            HYDROMETGRID: getFileStructure(ms.input_file?.files_and_pathnames?.meteorological_data?.HYDROMETGRID),
            HYDROMETCONVERT: getFileStructure(ms.input_file?.files_and_pathnames?.meteorological_data?.HYDROMETCONVERT),
            GAUGESTATIONS: getFileStructure(ms.input_file?.files_and_pathnames?.meteorological_data?.GAUGESTATIONS),
            GAUGECONVERT: getFileStructure(ms.input_file?.files_and_pathnames?.meteorological_data?.GAUGECONVERT),
            GAUGEBASENAME: getFileStructure(ms.input_file?.files_and_pathnames?.meteorological_data?.GAUGEBASENAME),
          },
          output_data: {
            OUTFILENAME: {
              file_database_paths:
                ms.input_file?.files_and_pathnames?.output_data?.OUTFILENAME?.file_database_paths,
              path:
                ms.input_file?.files_and_pathnames?.output_data?.OUTFILENAME?.path,
            },
            OUTHYDROFILENAME: {
              file_database_paths:
                ms.input_file?.files_and_pathnames?.output_data?.OUTHYDROFILENAME?.file_database_paths,
              path:
                ms.input_file?.files_and_pathnames?.output_data?.OUTHYDROFILENAME?.path,
            },
            OUTHYDROEXTENSION: ms.input_file?.files_and_pathnames?.output_data?.OUTHYDROEXTENSION,
            RIBSHYDOUTPUT: ms.input_file?.files_and_pathnames?.output_data?.RIBSHYDOUTPUT,
            NODEOUTPUTLIST: getFileStructure(ms.input_file?.files_and_pathnames?.output_data?.NODEOUTPUTLIST),
            HYDRONODELIST: getFileStructure(ms.input_file?.files_and_pathnames?.output_data?.HYDRONODELIST),
            OUTLETNODELIST: getFileStructure(ms.input_file?.files_and_pathnames?.output_data?.OUTLETNODELIST),
            OPTSPATIAL: ms.input_file?.run_options?.OPTSPATIAL,
            OPTINTERHYDRO: ms.input_file?.run_options?.OPTINTERHYDRO,
            OPTHEADER: ms.input_file?.run_options?.OPTHEADER,
          },
          resevoir_data: {
            RESPOLYGONID: getFileStructure(ms.input_file?.files_and_pathnames?.resevoir_data?.RESPOLYGONID),
            RESDATA: getFileStructure(ms.input_file?.files_and_pathnames?.resevoir_data?.RESDATA),
          }
        },
        modes: {
          rainfall_forecasting: {
            FORECASTMODE: ms.input_file?.modes?.rainfall_forecasting?.FORECASTMODE,
            FORECASTTIME: ms.input_file?.modes?.rainfall_forecasting?.FORECASTTIME,
            FORECASTLEADTIME: ms.input_file?.modes?.rainfall_forecasting?.FORECASTLEADTIME,
            FORECASTLENGTH: ms.input_file?.modes?.rainfall_forecasting?.FORECASTLENGTH,
            FORECASTFILE: getFileStructure(ms.input_file?.modes?.rainfall_forecasting?.FORECASTFILE),
            CLIMATOLOGY: ms.input_file?.modes?.rainfall_forecasting?.CLIMATOLOGY,
            RAINDISTRIBUTION: ms.input_file?.modes?.rainfall_forecasting?.RAINDISTRIBUTION
          },
          stochastic_climate_forcing: {
            STOCHASTICMODE: ms.input_file?.modes?.stochastic_climate_forcing?.STOCHASTICMODE,
            PMEAN: ms.input_file?.modes?.stochastic_climate_forcing?.PMEAN,
            STDUR: ms.input_file?.modes?.stochastic_climate_forcing?.STDUR,
            ISTDUR: ms.input_file?.modes?.stochastic_climate_forcing?.ISTDUR,
            SEED: ms.input_file?.modes?.stochastic_climate_forcing?.SEED,
            PERIOD: ms.input_file?.modes?.stochastic_climate_forcing?.PERIOD,
            MAXPMEAN: ms.input_file?.modes?.stochastic_climate_forcing?.MAXPMEAN,
            MAXSTDURMN: ms.input_file?.modes?.stochastic_climate_forcing?.MAXSTDURMN,
            MAXISTDURMN: ms.input_file?.modes?.stochastic_climate_forcing?.MAXISTDURMN,
            WEATHERTABLENAME: getFileStructure(ms.input_file?.modes?.stochastic_climate_forcing?.WEATHERTABLENAME),
          },
          restart: {
            RESTARTMODE: ms.input_file?.modes?.restart?.RESTARTMODE,
            RESTARTINTRVL: ms.input_file?.modes?.restart?.RESTARTINTRVL,
            RESTARTDIR: getFileStructure(ms.input_file?.modes?.restart?.RESTARTDIR),
            RESTARTFILE: getFileStructure(ms.input_file?.modes?.restart?.RESTARTFILE),
          },
          parallel: {
            PARALLELMODE: ms.input_file?.modes?.parallel?.PARALLELMODE,
            GRAPHOPTION: ms.input_file?.modes?.parallel?.GRAPHOPTION,
            GRAPHFILE: getFileStructure(ms.input_file?.modes?.parallel?.GRAPHFILE),
          },
        },
        visualization: {
          OPTVIZ: ms.input_file?.visualization?.OPTVIZ,
          OUTVIZFILENAME: getFileStructure(ms.input_file?.visualization?.OUTVIZFILENAME)
        }
      },
      linked_datasets: ms.linked_datasets,
      realizations: [{
        id: ms.realizations?.id,
        attributes: ms.realizations?.attributes,
        created_by: ms.realizations?.created_by,
        date_created: parseDate(ms.realizations?.date_created),
        description: ms.realizations?.description,
        display_type_plural: ms.realizations?.display_type_plural,
        display_type_singular: ms.realizations?.display_type_singular,
        locked: ms.realizations?.locked,
        name: ms.realizations?.name,
        organizations: ms.realizations?.organizations,
        public: ms.realizations?.public,
        slug: ms.realizations?.slug,
        status: ms.realizations?.status,
        type: ms.realizations?.type,
        input_file: {
          file_name: ms.realizations?.input_file?.file_name,
          run_parameters: {
            time_variables: {
              STARTDATE: parseDate(ms.realizations?.input_file?.run_parameters?.time_variables?.STARTDATE),
              RUNTIME: ms.realizations?.input_file?.run_parameters?.time_variables?.RUNTIME,
              TIMESTEP: ms.realizations?.input_file?.run_parameters?.time_variables?.TIMESTEP,
              GWSTEP: ms.realizations?.input_file?.run_parameters?.time_variables?.GWSTEP,
              METSTEP: ms.realizations?.input_file?.run_parameters?.time_variables?.METSTEP,
              ETISTEP: ms.realizations?.input_file?.run_parameters?.time_variables?.ETISTEP,
              RAININTRVL: ms.realizations?.input_file?.run_parameters?.time_variables?.RAININTRVL,
              OPINTRVL: ms.realizations?.input_file?.run_parameters?.time_variables?.OPINTRVL,
              SPOPINTRVL: ms.realizations?.input_file?.run_parameters?.time_variables?.SPOPINTRVL,
              INTSTORMMAX: ms.realizations?.input_file?.run_parameters?.time_variables?.INTSTORMMAX,
              RAINSEARCH: ms.realizations?.input_file?.run_parameters?.time_variables?.RAINSEARCH
            },
            routing_variables: {
              BASEFLOW: ms.realizations?.input_file?.run_parameters?.routing_variables?.BASEFLOW,
              VELOCITYCOEF: ms.realizations?.input_file?.run_parameters?.routing_variables?.VELOCITYCOEF,
              VELOCITYRATIO: ms.realizations?.input_file?.run_parameters?.routing_variables?.VELOCITYRATIO,
              KINEMVELCOEF: ms.realizations?.input_file?.run_parameters?.routing_variables?.KINEMVELCOEF,
              FLOWEXP: ms.realizations?.input_file?.run_parameters?.routing_variables?.FLOWEXP,
              CHANNELROUGHNESS: ms.realizations?.input_file?.run_parameters?.routing_variables?.CHANNELROUGHNESS,
              CHANNELWIDTH: ms.realizations?.input_file?.run_parameters?.routing_variables?.CHANNELWIDTH,
              CHANNELWIDTHCOEFF: ms.realizations?.input_file?.run_parameters?.routing_variables?.CHANNELWIDTHCOEFF,
              CHANNELWIDTHEXPNT: ms.realizations?.input_file?.run_parameters?.routing_variables?.CHANNELWIDTHEXPNT,
              CHANNELWIDTHFILE: getFileStructure(ms.realizations?.input_file?.run_parameters?.routing_variables?.CHANNELWIDTHFILE)
            },
            meteorological_variables: {
              TLINKE: ms.realizations?.input_file?.run_parameters?.meteorological_variables?.TLINKE,
              MINSNTEMP: ms.realizations?.input_file?.run_parameters?.meteorological_variables?.MINSNTEMP,
              TEMPLAPSE: ms.realizations?.input_file?.run_parameters?.meteorological_variables?.TEMPLAPSE,
              PRECLAPSE: ms.realizations?.input_file?.run_parameters?.meteorological_variables?.PRECLAPSE,
              SNLIQFRAC: ms.realizations?.input_file?.run_parameters?.meteorological_variables?.SNLIQFRAC
            }
          },
          run_options: {
            OPTMESHINPUT: ms.realizations?.input_file?.run_options?.OPTMESHINPUT,
            RAINSOURCE: ms.realizations?.input_file?.run_options?.RAINSOURCE,
            OPTEVAPOTRANS: ms.realizations?.input_file?.run_options?.OPTEVAPOTRANS,
            OPTSNOW: ms.realizations?.input_file?.run_options?.OPTSNOW,
            HILLALBOPT: ms.realizations?.input_file?.run_options?.HILLALBOPT,
            OPTRADSHELT: ms.realizations?.input_file?.run_options?.OPTRADSHELT,
            OPTINTERCEPT: ms.realizations?.input_file?.run_options?.OPTINTERCEPT,
            OPTLANDUSE: ms.realizations?.input_file?.run_options?.OPTLANDUSE,
            OPTLUINTERP: ms.realizations?.input_file?.run_options?.OPTLUINTERP,
            GFLUXOPTION: ms.realizations?.input_file?.run_options?.GFLUXOPTION,
            METDATAOPTION: ms.realizations?.input_file?.run_options?.METDATAOPTION,
            CONVERTDATA: ms.realizations?.input_file?.run_options?.CONVERTDATA,
            OPTBEDROCK: ms.realizations?.input_file?.run_options?.OPTBEDROCK,
            OPTGROUNDWATER: ms.realizations?.input_file?.run_options?.OPTGROUNDWATER,
            WIDTHINTERPOLATION: ms.realizations?.input_file?.run_options?.WIDTHINTERPOLATION,
            OPTGWFILE: ms.realizations?.input_file?.run_options?.OPTGWFILE,
            OPTRUNON: ms.realizations?.input_file?.run_options?.OPTRUNON,
            OPTRESERVOIR: ms.realizations?.input_file?.run_options?.OPTRESERVOIR,
            OPTSOILTYPE: ms.realizations?.input_file?.run_options?.OPTSOILTYPE,
            OPTPERCOLATION: ms.realizations?.input_file?.run_options?.OPTPERCOLATION
          },
          files_and_pathnames: {
            mesh_generation: {
              INPUTDATAFILE: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.mesh_generation?.INPUTDATAFILE),
              POINTFILENAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.mesh_generation?.POINTFILENAME),
              INPUTTIME:
                ms.realizations?.input_file?.files_and_pathnames?.mesh_generation?.INPUTTIME,
              ARCINFOFILENAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.mesh_generation?.ARCINFOFILENAME)
            },
            resampling_grids: {
              SOILTABLENAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.SOILTABLENAME),
              SOILMAPNAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.SOILMAPNAME),
              LANDTABLENAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.LANDTABLENAME),
              LANDMAPNAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.LANDMAPNAME),
              GWATERFILE: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.GWATERFILE),
              DEMFILE: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.DEMFILE),
              RAINFILE: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.RAINFILE),
              RAINEXTENSION: ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.RAINEXTENSION,
              DEPTHTOBEDROCK: ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.DEPTHTOBEDROCK,
              BEDROCKFILE: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.BEDROCKFILE),
              LUGRID: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.LUGRID),
              SCGRID: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resampling_grids?.SCGRID),
            },
            meteorological_data: {
              HYDROMETSTATIONS: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.meteorological_data?.HYDROMETSTATIONS),
              HYDROMETGRID: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.meteorological_data?.HYDROMETGRID),
              HYDROMETCONVERT: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.meteorological_data?.HYDROMETCONVERT),
              GAUGESTATIONS: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.meteorological_data?.GAUGESTATIONS),
              GAUGECONVERT: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.meteorological_data?.GAUGECONVERT),
              GAUGEBASENAME: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.meteorological_data?.GAUGEBASENAME),
            },
            output_data: {
              OUTFILENAME: {
                file_database_paths:
                  ms.realizations?.input_file?.files_and_pathnames?.output_data?.OUTFILENAME?.file_database_paths,
                path:
                  ms.realizations?.input_file?.files_and_pathnames?.output_data?.OUTFILENAME?.path,
              },
              OUTHYDROFILENAME: {
                file_database_paths:
                  ms.realizations?.input_file?.files_and_pathnames?.output_data?.OUTHYDROFILENAME?.file_database_paths,
                path:
                  ms.realizations?.input_file?.files_and_pathnames?.output_data?.OUTHYDROFILENAME?.path,
              },
              OUTHYDROEXTENSION: ms.realizations?.input_file?.files_and_pathnames?.output_data?.OUTHYDROEXTENSION,
              RIBSHYDOUTPUT: ms.realizations?.input_file?.files_and_pathnames?.output_data?.RIBSHYDOUTPUT,
              NODEOUTPUTLIST: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.output_data?.NODEOUTPUTLIST),
              HYDRONODELIST: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.output_data?.HYDRONODELIST),
              OUTLETNODELIST: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.output_data?.OUTLETNODELIST),
              OPTSPATIAL: ms.realizations?.input_file?.run_options?.OPTSPATIAL,
              OPTINTERHYDRO: ms.realizations?.input_file?.run_options?.OPTINTERHYDRO,
              OPTHEADER: ms.realizations?.input_file?.run_options?.OPTHEADER,
            },
            resevoir_data: {
              RESPOLYGONID: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resevoir_data?.RESPOLYGONID),
              RESDATA: getFileStructure(ms.realizations?.input_file?.files_and_pathnames?.resevoir_data?.RESDATA),
            }
          },
          modes: {
            rainfall_forecasting: {
              FORECASTMODE: ms.realizations?.input_file?.modes?.rainfall_forecasting?.FORECASTMODE,
              FORECASTTIME: ms.realizations?.input_file?.modes?.rainfall_forecasting?.FORECASTTIME,
              FORECASTLEADTIME: ms.realizations?.input_file?.modes?.rainfall_forecasting?.FORECASTLEADTIME,
              FORECASTLENGTH: ms.realizations?.input_file?.modes?.rainfall_forecasting?.FORECASTLENGTH,
              FORECASTFILE: getFileStructure(ms.realizations?.input_file?.modes?.rainfall_forecasting?.FORECASTFILE),
              CLIMATOLOGY: ms.realizations?.input_file?.modes?.rainfall_forecasting?.CLIMATOLOGY,
              RAINDISTRIBUTION: ms.realizations?.input_file?.modes?.rainfall_forecasting?.RAINDISTRIBUTION
            },
            stochastic_climate_forcing: {
              STOCHASTICMODE: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.STOCHASTICMODE,
              PMEAN: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.PMEAN,
              STDUR: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.STDUR,
              ISTDUR: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.ISTDUR,
              SEED: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.SEED,
              PERIOD: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.PERIOD,
              MAXPMEAN: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.MAXPMEAN,
              MAXSTDURMN: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.MAXSTDURMN,
              MAXISTDURMN: ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.MAXISTDURMN,
              WEATHERTABLENAME: getFileStructure(ms.realizations?.input_file?.modes?.stochastic_climate_forcing?.WEATHERTABLENAME),
            },
            restart: {
              RESTARTMODE: ms.realizations?.input_file?.modes?.restart?.RESTARTMODE,
              RESTARTINTRVL: ms.realizations?.input_file?.modes?.restart?.RESTARTINTRVL,
              RESTARTDIR: getFileStructure(ms.realizations?.input_file?.modes?.restart?.RESTARTDIR),
              RESTARTFILE: getFileStructure(ms.realizations?.input_file?.modes?.restart?.RESTARTFILE),
            },
            parallel: {
              PARALLELMODE: ms.realizations?.input_file?.modes?.parallel?.PARALLELMODE,
              GRAPHOPTION: ms.realizations?.input_file?.modes?.parallel?.GRAPHOPTION,
              GRAPHFILE: getFileStructure(ms.realizations?.input_file?.modes?.parallel?.GRAPHFILE),
            },
          },
          visualization: {
            OPTVIZ: ms.realizations?.input_file?.visualization?.OPTVIZ,
            OUTVIZFILENAME: getFileStructure(ms.realizations?.input_file?.visualization?.OUTVIZFILENAME)
          }
        },
        linked_datasets: ms.realizations?.linked_datasets
      }]
    }
  )
};

