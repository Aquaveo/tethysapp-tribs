import * as Yup from "yup";
import * as ProjectConstants from 'constants/projectConstants.js';

const ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f][0-9a-f]{3}-[0-9a-f]{12}$/;

const INPUT_FILE_VALIDATION = {
  resource_id: Yup.string().nullable().nullable().matches(ID_REGEX),
  file_collection_id: Yup.string().nullable().nullable().matches(ID_REGEX),
  file_collection_paths: Yup.array(),
  path: Yup.string(),
}

const modelControlSchema = Yup.object().shape({
  id: Yup.string().nullable().matches(ID_REGEX),
  attributes: Yup.object().shape({
    srid: Yup.string(),
    files: Yup.array(),
  }), // This isn't defined anywhere yet.
  created_by: Yup.string(),
  date_created: Yup.date(),
  description: Yup.string(),
  display_type_plural: Yup.string(),
  display_type_singular: Yup.string(),
  locked: Yup.boolean(),
  name: Yup.string(),
  organizations: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().nullable().nullable().matches(ID_REGEX),
        name: Yup.string(),
      })
    ),
  public: Yup.boolean(),
  slug: Yup.string(),
  status: Yup.string().nullable(), // Not defined yet.
  type: Yup.string(),
  input_file: Yup.object().shape({
    file_name: Yup.string(), // Change this to match certain file formats
    run_parameters: Yup.object().shape({
      time_variables: Yup.object().shape({
        STARTDATE: Yup.date(),
        RUNTIME: Yup.number(),
        TIMESTEP: Yup.number(),
        GWSTEP: Yup.number(),
        METSTEP: Yup.number(),
        ETISTEP: Yup.number(),
        RAININTRVL: Yup.number(),
        OPINTRVL: Yup.number(),
        SPOPINTRVL: Yup.number(),
        INTSTORMMAX: Yup.number(),
        RAINSEARCH: Yup.number()
      }),
      routing_variables: Yup.object().shape({
        BASEFLOW: Yup.number(),
        VELOCITYCOEF: Yup.number(),
        VELOCITYRATIO: Yup.number(),
        KINEMVELCOEF: Yup.number(),
        FLOWEXP: Yup.number(), // This needs to be an exponent number
        CHANNELROUGHNESS: Yup.number(),
        CHANNELWIDTH: Yup.number(),
        CHANNELWIDTHCOEFF: Yup.number(),
        CHANNELWIDTHEXPNT: Yup.number(),
        CHANNELWIDTHFILE: Yup.object().shape(INPUT_FILE_VALIDATION)
      }),
      meteorological_variables: Yup.object().shape({
        TLINKE: Yup.number(),
        MINSNTEMP: Yup.number(),
        TEMPLAPSE: Yup.number(),
        PRECLAPSE: Yup.number(),
        SNLIQFRAC: Yup.number()
      })
    }),
    run_options: Yup.object().shape({
      OPTMESHINPUT: Yup.number().oneOf(Object.values(ProjectConstants.OPTMESHINPUT)),
      RAINSOURCE: Yup.number().oneOf(Object.values(ProjectConstants.RAINSOURCE)),
      OPTEVAPOTRANS: Yup.number().oneOf(Object.values(ProjectConstants.OPTEVAPOTRANS)),
      OPTSNOW: Yup.number().oneOf(Object.values(ProjectConstants.OPTSNOW)),
      HILLALBOPT: Yup.number().oneOf(Object.values(ProjectConstants.HILLALBOPT)),
      OPTRADSHELT: Yup.number().oneOf(Object.values(ProjectConstants.OPTRADSHELT)),
      OPTINTERCEPT: Yup.number().oneOf(Object.values(ProjectConstants.OPTINTERCEPT)),
      OPTLANDUSE: Yup.number().oneOf(Object.values(ProjectConstants.OPTLANDUSE)),
      OPTLUINTERP: Yup.number().oneOf(Object.values(ProjectConstants.OPTLUINTERP)),
      GFLUXOPTION: Yup.number().oneOf(Object.values(ProjectConstants.GFLUXOPTION)),
      METDATAOPTION: Yup.number().oneOf(Object.values(ProjectConstants.METDATAOPTION)),
      CONVERTDATA: Yup.number().oneOf(Object.values(ProjectConstants.CONVERTDATA)),
      OPTBEDROCK: Yup.number().oneOf(Object.values(ProjectConstants.OPTBEDROCK)),
      OPTGROUNDWATER: Yup.number().oneOf(Object.values(ProjectConstants.OPTGROUNDWATER)),
      WIDTHINTERPOLATION: Yup.number().oneOf(Object.values(ProjectConstants.WIDTHINTERPOLATION)),
      OPTGWFILE: Yup.number().oneOf(Object.values(ProjectConstants.OPTGWFILE)),
      OPTRUNON: Yup.number().oneOf(Object.values(ProjectConstants.OPTRUNON)),
      OPTRESERVOIR: Yup.number().oneOf(Object.values(ProjectConstants.OPTRESERVOIR)),
      OPTSOILTYPE: Yup.number().oneOf(Object.values(ProjectConstants.OPTSOILTYPE)),
      OPTPERCOLATION: Yup.number().oneOf(Object.values(ProjectConstants.OPTPERCOLATION))
    }),
    files_and_pathnames: Yup.object().shape({
      mesh_generation: Yup.object().shape({
        INPUTDATAFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
        POINTFILENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
        INPUTTIME: Yup.number(),
        ARCINFOFILENAME: Yup.object().shape(INPUT_FILE_VALIDATION)
      }),
      resampling_grids: Yup.object().shape({
        SOILTABLENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
        SOILMAPNAME: Yup.object().shape(INPUT_FILE_VALIDATION),
        LANDTABLENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
        LANDMAPNAME: Yup.object().shape(INPUT_FILE_VALIDATION),
        GWATERFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
        DEMFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
        RAINFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
        RAINEXTENSION: Yup.string(),
        DEPTHTOBEDROCK: Yup.number(),
        BEDROCKFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
        LUGRID: Yup.object().shape(INPUT_FILE_VALIDATION),
        SCGRID: Yup.object().shape(INPUT_FILE_VALIDATION),
      }),
      meteorological_data: Yup.object().shape({
        HYDROMETSTATIONS: Yup.object().shape(INPUT_FILE_VALIDATION),
        HYDROMETGRID: Yup.object().shape(INPUT_FILE_VALIDATION),
        HYDROMETCONVERT: Yup.object().shape(INPUT_FILE_VALIDATION),
        HYDROMETBASENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
        GAUGESTATIONS: Yup.object().shape(INPUT_FILE_VALIDATION),
        GAUGECONVERT: Yup.object().shape(INPUT_FILE_VALIDATION),
        GAUGEBASENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
      }),
      output_data: Yup.object().shape({
        OUTFILENAME: Yup.object().shape({
          file_database_paths: Yup.array(),
          path: Yup.string(),
        }),
        OUTHYDROFILENAME: Yup.object().shape({
          file_database_paths: Yup.array(),
          path: Yup.string(),
        }),
        OUTHYDROEXTENSION: Yup.string(), // This should be a certain file ext
        RIBSHYDOUTPUT: Yup.number(),
        NODEOUTPUTLIST: Yup.object().shape(INPUT_FILE_VALIDATION),
        HYDRONODELIST: Yup.object().shape(INPUT_FILE_VALIDATION),
        OUTLETNODELIST: Yup.object().shape(INPUT_FILE_VALIDATION),
        OPTSPATIAL: Yup.number().oneOf(Object.values(ProjectConstants.OPTSPATIAL)),
        OPTINTERHYDRO: Yup.number().oneOf(Object.values(ProjectConstants.OPTINTERHYDRO)),
        OPTHEADER: Yup.number().oneOf(Object.values(ProjectConstants.OPTHEADER)),
      }),
      resevoir_data: Yup.object().shape({
        RESPOLYGONID: Yup.object().shape(INPUT_FILE_VALIDATION),
        RESDATA: Yup.object().shape(INPUT_FILE_VALIDATION),
      })
    }),
    modes: Yup.object().shape({
      rainfall_forecasting: Yup.object().shape({ // It looks like most of this isn't defined.
        FORECASTMODE: Yup.number().oneOf(Object.values(ProjectConstants.FORECASTMODE)),
        FORECASTTIME: Yup.string(),
        FORECASTLEADTIME: Yup.string(),
        FORECASTLENGTH: Yup.string(),
        FORECASTFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
        CLIMATOLOGY: Yup.string(),
        RAINDISTRIBUTION: Yup.number().oneOf(Object.values(ProjectConstants.RAINDISTRIBUTION))
      }),
      stochastic_climate_forcing: Yup.object().shape({
        STOCHASTICMODE: Yup.number().oneOf(Object.values(ProjectConstants.STOCHASTICMODE)),
        PMEAN: Yup.number(),
        STDUR: Yup.number(),
        ISTDUR: Yup.number(),
        SEED: Yup.number(),
        PERIOD: Yup.number(),
        MAXPMEAN: Yup.number(),
        MAXSTDURMN: Yup.number(),
        MAXISTDURMN: Yup.number(),
        WEATHERTABLENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
      }),
      restart: Yup.object().shape({
        RESTARTMODE: Yup.number().oneOf(Object.values(ProjectConstants.RESTARTMODE)),
        RESTARTINTRVL: Yup.number(),
        RESTARTDIR: Yup.object().shape(INPUT_FILE_VALIDATION),
        RESTARTFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
      }),
      parallel: Yup.object().shape({
        PARALLELMODE: Yup.number().oneOf(Object.values(ProjectConstants.PARALLELMODE)),
        GRAPHOPTION: Yup.number().oneOf(Object.values(ProjectConstants.GRAPHOPTION)),
        GRAPHFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
      }),
    }),
    visualization: Yup.object().shape({
      OPTVIZ: Yup.number().oneOf(Object.values(ProjectConstants.OPTVIZ)),
      OUTVIZFILENAME: Yup.object().shape(INPUT_FILE_VALIDATION)
    })
  }),
  linked_dataset: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().nullable().matches(ID_REGEX),
      name: Yup.string()
    })
  ),
  realizations: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().nullable().matches(ID_REGEX),
      attributes: Yup.object(), // This isn't defined anywhere yet.
      created_by: Yup.string(),
      date_created: Yup.date(),
      description: Yup.string(),
      display_type_plural: Yup.string(),
      display_type_singular: Yup.string(),
      locked: Yup.boolean(),
      name: Yup.string(),
      organizations: Yup.array(), // This isn't defined yet.
      public: Yup.boolean(),
      slug: Yup.string(),
      status: Yup.string(), // Not defined yet.
      type: Yup.string(),
      input_file: Yup.object().shape({
        file_name: Yup.string(), // Change this to match certain file formats
        run_parameters: Yup.object().shape({
          time_variables: Yup.object().shape({
            STARTDATE: Yup.date(),
            RUNTIME: Yup.number(),
            TIMESTEP: Yup.number(),
            GWSTEP: Yup.number(),
            METSTEP: Yup.number(),
            ETISTEP: Yup.number(),
            RAININTRVL: Yup.number(),
            OPINTRVL: Yup.number(),
            SPOPINTRVL: Yup.number(),
            INTSTORMMAX: Yup.number(),
            RAINSEARCH: Yup.number()
          }),
          routing_variables: Yup.object().shape({
            BASEFLOW: Yup.number(),
            VELOCITYCOEF: Yup.number(),
            VELOCITYRATIO: Yup.number(),
            KINEMVELCOEF: Yup.number(),
            FLOWEXP: Yup.number(), // This needs to be an exponent number
            CHANNELROUGHNESS: Yup.number(),
            CHANNELWIDTH: Yup.number(),
            CHANNELWIDTHCOEFF: Yup.number(),
            CHANNELWIDTHEXPNT: Yup.number(),
            CHANNELWIDTHFILE: Yup.object().shape(INPUT_FILE_VALIDATION)
          }),
          meteorological_variables: Yup.object().shape({
            TLINKE: Yup.number(),
            MINSNTEMP: Yup.number(),
            TEMPLAPSE: Yup.number(),
            PRECLAPSE: Yup.number(),
            SNLIQFRAC: Yup.number()
          })
        }),
        run_options: Yup.object().shape({
          OPTMESHINPUT: Yup.number().oneOf(Object.values(ProjectConstants.OPTMESHINPUT)),
          RAINSOURCE: Yup.number().oneOf(Object.values(ProjectConstants.RAINSOURCE)),
          OPTEVAPOTRANS: Yup.number().oneOf(Object.values(ProjectConstants.OPTEVAPOTRANS)),
          OPTSNOW: Yup.number().oneOf(Object.values(ProjectConstants.OPTSNOW)),
          HILLALBOPT: Yup.number().oneOf(Object.values(ProjectConstants.HILLALBOPT)),
          OPTRADSHELT: Yup.number().oneOf(Object.values(ProjectConstants.OPTRADSHELT)),
          OPTINTERCEPT: Yup.number().oneOf(Object.values(ProjectConstants.OPTINTERCEPT)),
          OPTLANDUSE: Yup.number().oneOf(Object.values(ProjectConstants.OPTLANDUSE)),
          OPTLUINTERP: Yup.number().oneOf(Object.values(ProjectConstants.OPTLUINTERP)),
          GFLUXOPTION: Yup.number().oneOf(Object.values(ProjectConstants.GFLUXOPTION)),
          METDATAOPTION: Yup.number().oneOf(Object.values(ProjectConstants.METDATAOPTION)),
          CONVERTDATA: Yup.number().oneOf(Object.values(ProjectConstants.CONVERTDATA)),
          OPTBEDROCK: Yup.number().oneOf(Object.values(ProjectConstants.OPTBEDROCK)),
          OPTGROUNDWATER: Yup.number().oneOf(Object.values(ProjectConstants.OPTGROUNDWATER)),
          WIDTHINTERPOLATION: Yup.number().oneOf(Object.values(ProjectConstants.WIDTHINTERPOLATION)),
          OPTGWFILE: Yup.number().oneOf(Object.values(ProjectConstants.OPTGWFILE)),
          OPTRUNON: Yup.number().oneOf(Object.values(ProjectConstants.OPTRUNON)),
          OPTRESERVOIR: Yup.number().oneOf(Object.values(ProjectConstants.OPTRESERVOIR)),
          OPTSOILTYPE: Yup.number().oneOf(Object.values(ProjectConstants.OPTSOILTYPE)),
          OPTPERCOLATION: Yup.number().oneOf(Object.values(ProjectConstants.OPTPERCOLATION))
        }),
        files_and_pathnames: Yup.object().shape({
          mesh_generation: Yup.object().shape({
            INPUTDATAFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
            POINTFILENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
            INPUTTIME: Yup.number(),
            ARCINFOFILENAME: Yup.object().shape(INPUT_FILE_VALIDATION)
          }),
          resampling_grids: Yup.object().shape({
            SOILTABLENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
            SOILMAPNAME: Yup.object().shape(INPUT_FILE_VALIDATION),
            LANDTABLENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
            LANDMAPNAME: Yup.object().shape(INPUT_FILE_VALIDATION),
            GWATERFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
            DEMFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
            RAINFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
            RAINEXTENSION: Yup.string(),
            DEPTHTOBEDROCK: Yup.number(),
            BEDROCKFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
            LUGRID: Yup.object().shape(INPUT_FILE_VALIDATION),
            SCGRID: Yup.object().shape(INPUT_FILE_VALIDATION),
          }),
          meteorological_data: Yup.object().shape({
            HYDROMETSTATIONS: Yup.object().shape(INPUT_FILE_VALIDATION),
            HYDROMETGRID: Yup.object().shape(INPUT_FILE_VALIDATION),
            HYDROMETCONVERT: Yup.object().shape(INPUT_FILE_VALIDATION),
            GAUGESTATIONS: Yup.object().shape(INPUT_FILE_VALIDATION),
            GAUGECONVERT: Yup.object().shape(INPUT_FILE_VALIDATION),
            GAUGEBASENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
          }),
          output_data: Yup.object().shape({
            OUTFILENAME: Yup.object().shape({
              file_database_paths: Yup.array(),
              path: Yup.string(),
            }),
            OUTHYDROFILENAME: Yup.object().shape({
              file_database_paths: Yup.array(),
              path: Yup.string(),
            }),
            OUTHYDROEXTENSION: Yup.string(), // This should be a certain file ext
            RIBSHYDOUTPUT: Yup.number(),
            NODEOUTPUTLIST: Yup.object().shape(INPUT_FILE_VALIDATION),
            HYDRONODELIST: Yup.object().shape(INPUT_FILE_VALIDATION),
            OUTLETNODELIST: Yup.object().shape(INPUT_FILE_VALIDATION),
            OPTSPATIAL: Yup.number().oneOf(Object.values(ProjectConstants.OPTSPATIAL)),
            OPTINTERHYDRO: Yup.number().oneOf(Object.values(ProjectConstants.OPTINTERHYDRO)),
            OPTHEADER: Yup.number().oneOf(Object.values(ProjectConstants.OPTHEADER)),
          }),
          resevoir_data: Yup.object().shape({
            RESPOLYGONID: Yup.object().shape(INPUT_FILE_VALIDATION),
            RESDATA: Yup.object().shape(INPUT_FILE_VALIDATION),
          })
        }),
        modes: Yup.object().shape({
          rainfall_forecasting: Yup.object().shape({ // It looks like most of this isn't defined.
            FORECASTMODE: Yup.number().oneOf(Object.values(ProjectConstants.FORECASTMODE)),
            FORECASTTIME: Yup.string(),
            FORECASTLEADTIME: Yup.string(),
            FORECASTLENGTH: Yup.string(),
            FORECASTFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
            CLIMATOLOGY: Yup.string(),
            RAINDISTRIBUTION: Yup.number().oneOf(Object.values(ProjectConstants.RAINDISTRIBUTION))
          }),
          stochastic_climate_forcing: Yup.object().shape({
            STOCHASTICMODE: Yup.number().oneOf(Object.values(ProjectConstants.STOCHASTICMODE)),
            PMEAN: Yup.number(),
            STDUR: Yup.number(),
            ISTDUR: Yup.number(),
            SEED: Yup.number(),
            PERIOD: Yup.number(),
            MAXPMEAN: Yup.number(),
            MAXSTDURMN: Yup.number(),
            MAXISTDURMN: Yup.number(),
            WEATHERTABLENAME: Yup.object().shape(INPUT_FILE_VALIDATION),
          }),
          restart: Yup.object().shape({
            RESTARTMODE: Yup.number().oneOf(Object.values(ProjectConstants.RESTARTMODE)),
            RESTARTINTRVL: Yup.number(),
            RESTARTDIR: Yup.object().shape(INPUT_FILE_VALIDATION),
            RESTARTFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
          }),
          parallel: Yup.object().shape({
            PARALLELMODE: Yup.number().oneOf(Object.values(ProjectConstants.PARALLELMODE)),
            GRAPHOPTION: Yup.number().oneOf(Object.values(ProjectConstants.GRAPHOPTION)),
            GRAPHFILE: Yup.object().shape(INPUT_FILE_VALIDATION),
          }),
        }),
        visualization: Yup.object().shape({
          OPTVIZ: Yup.number().oneOf(Object.values(ProjectConstants.OPTVIZ)),
          OUTVIZFILENAME: Yup.object().shape({
            resource_id: Yup.string().nullable().matches(ID_REGEX),
            file_collection_id: Yup.string().nullable().matches(ID_REGEX),
            file_collection_paths: Yup.array(),
            path: Yup.string(),
          })
        })
      }),
      linked_dataset: Yup.array().of(
        Yup.object().shape({
          id: Yup.string().nullable().matches(ID_REGEX),
          name: Yup.string()
        })
      ),
    })
  )
});

export default modelControlSchema;