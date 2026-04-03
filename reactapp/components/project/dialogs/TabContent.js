import { Col, Row } from "react-bootstrap";
import TextInput from "components/forms/TextInput";
import DateInput from 'components/forms/DateInput';
import NumberInput from 'components/forms/NumberInput';
import SelectInput from 'components/forms/SelectInput';
import { DATASET_TYPE_MAPS, KEY_NAME_TO_DATASET_TYPE_MAP } from "constants/projectConstants";
import FileSelect from "../forms/FileSelect";

import * as ProjectConstants from 'constants/projectConstants.js';
import * as UnitConstants from 'constants/unitConstants.js';
import * as ToolTipConstants from "constants/tooltipConstants";
import { NON_RENDER_KEYS, READ_ONLY_KEYS } from "constants/ModelControlConstants";

export function getKeyNames(obj) {
  const keysWithObjects = Object.entries(obj)
    .filter(([key, value]) => typeof value === 'object')
    .map(([key]) => key);

  const keysCapitalized = keysWithObjects.map(key => {
    return getCapitalizedKey(key);
  });

  return keysCapitalized;
}

export function getCapitalizedKey(key) {
  const words = key.split('_');
  const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
  return capitalizedWords.join(' ');
}

export function getDatasetTypeForId(id, datasetList) {
  // This will eventually be replaced with the KEY_NAME_TO_DATASET_TYPE_MAP enum
  // Use this to debug and find out 
  const dataset = datasetList.find(item => item.id === id);
  return dataset ? DATASET_TYPE_MAPS[dataset.dataset_type] : null;
}

export function groupByIdAndType(datasets) {
  const result = {};
  if (!datasets) {
    return result;
  }

  datasets.forEach(dataset => {
    const { id, name, dataset_type } = dataset;
    const datasetGroup = DATASET_TYPE_MAPS[dataset_type] || ProjectConstants.DATASET_GROUPS.OTHER;

    if (!result[datasetGroup]) {
      result[datasetGroup] = [];
    }
    result[datasetGroup].push({id, name});
  });

  return result;
}

function camelCaseToTitleCase(inputString) {
  // Replace camelCase with space-separated words
  const spacedWords = inputString.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Handle specific case for "III" by inserting space before it
  const formattedString = spacedWords.replace(/III/g, 'III ');

  // Capitalize the first letter of each word
  const titleCaseString = formattedString.replace(/\b\w/g, (match) => match.toUpperCase());

  return titleCaseString;
}

export function TabContent(
    keysWithObjects,
    values,
    keyName,
    datasets,
    dataset_types_map,
    readOnly = false,
  ) {
  return Object.entries(keysWithObjects).map((entries, colIndex) => {
    const [nestedKeyName, nestedValue] = entries
    const firstValue = values[nestedKeyName];
    const valueType = typeof firstValue;
    const name = `input_file.${keyName}.${nestedKeyName}`;

    const readOnlyInput = readOnly || READ_ONLY_KEYS.includes(nestedKeyName);
    const doNotRenderInput = NON_RENDER_KEYS.includes(nestedKeyName);

    if (doNotRenderInput) {
      return null;
    }

    if (ProjectConstants[nestedKeyName]) {
      return (
        <SelectInput
          key={colIndex}
          label={getCapitalizedKey(nestedKeyName)}
          name={name}
          tooltip={ToolTipConstants[nestedKeyName]}
          options={[
            { value: "", label: 'Select an Option' },
            ...Object.keys(ProjectConstants[nestedKeyName]).map((constantName) => {
              const constantValue = ProjectConstants[nestedKeyName][constantName];
              return {
                value: constantValue,
                label: `${camelCaseToTitleCase(constantName)} (${constantValue})`,
              };
            }),
          ]}
          readOnly={readOnlyInput}
        />
      );
    } else if (valueType === "number") {
      return (
        <NumberInput
          key={colIndex}
          label={getCapitalizedKey(nestedKeyName)}
          name={name}
          units={UnitConstants[nestedKeyName] ? UnitConstants[nestedKeyName] : ""}
          tooltip={ToolTipConstants[nestedKeyName]}
          readOnly={readOnlyInput}
        />
      );
    } else if (valueType === "string") {
      return (
        <TextInput
          key={colIndex}
          label={getCapitalizedKey(nestedKeyName)}
          name={name}
          tooltip={ToolTipConstants[nestedKeyName]}
          readOnly={nestedKeyName === "resource_id" || readOnlyInput}
        />
      );
    } else if (Array.isArray(firstValue)) {
      // Prevents any key to array from rendering like file_collection_paths.
      return (null);
    } else if (
      (valueType === "object" && firstValue instanceof Date) ||
      nestedKeyName.toLowerCase().includes("date")
    ) {
      return (
        <DateInput
          key={colIndex}
          label={getCapitalizedKey(nestedKeyName)}
          name={name}
          tooltip={ToolTipConstants[nestedKeyName]}
          readOnly={readOnlyInput}
        />
      );
    } else if (valueType === "object" && nestedValue !== null) {
      const firstObjKey = Object.keys(firstValue)[0];
      if (firstObjKey === "resource_id") {
        // Type Unrestricted Datasets
        const dataset_type = KEY_NAME_TO_DATASET_TYPE_MAP[nestedKeyName];
        // If dataset_type exists then the dataset is Semi-Restricted
        // If it is, then it won't default to be able to select from all datasets like the Unrestricted Datasets.
        const typeDatasets = dataset_type ? [] : datasets;
        const selectableDatasets = dataset_types_map[dataset_type] ?? typeDatasets;

        // Type Restricted Datasets
        const restrictedDatasetTypes = ProjectConstants.RESTRICTED_DATASET_TYPES[nestedKeyName];
        const filteredDatasets = restrictedDatasetTypes
          ? selectableDatasets.filter((dataset) => restrictedDatasetTypes.includes(dataset.dataset_type))
          : selectableDatasets;

        return (
          <FileSelect
            key={colIndex}
            id={`${name}_${colIndex}`}
            label={getCapitalizedKey(nestedKeyName)}
            tooltip={ToolTipConstants[nestedKeyName]}
            selectOptions={{
              name: `${name}.resource_id`,
              options: [
                { value: "", label: 'Select a File' },
                ...(filteredDatasets).map((option) => ({
                  value: `${option.id}`,
                  label: option.name,
                })),
              ],
            }}
            readOnly={readOnlyInput}
          />
        );
      } else if (Object.keys(firstValue)[1] === "path") {
        // Prevents the Output data's OUTFILENAME and OUTHYDROFILENAME from rendering
        return null;
      }
      return (
        <div key={colIndex}>
          <Row>
            <Col sm={3} />
            <Col sm={9}>
              <h5 key={colIndex}>
                {getCapitalizedKey(nestedKeyName)}
              </h5>
            </Col>
          </Row>
          {TabContent(
            nestedValue,
            values[nestedKeyName],
            `${keyName}.${nestedKeyName}`,
            datasets,
            dataset_types_map,
            readOnly
          )}
        </div>
      );
    }

    return (
      <div key={colIndex}>
        {`Debug ${getCapitalizedKey(nestedKeyName)}`}
      </div>
    );
  });
}
