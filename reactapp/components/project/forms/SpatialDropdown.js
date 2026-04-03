import { debounce } from "lodash";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncSelect from 'react-select';

function SpatialDropdown({ onSelect, select }) {
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [referenceOptions, setReferenceOptions] = useState([])
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  
  const fetchSpatialRefs = useCallback(async (value) => {
    const url = TETHYS_ROOT_URL + `rest/spatial-reference/query/?q=${value}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { results } = await response.json();
      const formattedResults = results.map(item => ({
        value: item.id,
        label: `${item.text} (${item.id})`
      }))

      setReferenceOptions(formattedResults);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching spatial references:', error);
      setReferenceOptions([]);
    }
  }, [TETHYS_ROOT_URL]);

  const debouncedFetchSpatialRefs = useMemo(() => {
    return debounce(fetchSpatialRefs, 500);
  }, [fetchSpatialRefs]);

  useEffect(() => {
    if (query && query.length >= 2) {
      setIsLoading(true);
      debouncedFetchSpatialRefs(query);
    }
  }, [query, debouncedFetchSpatialRefs])

  return (
    <AsyncSelect
      cacheOptions
      value={referenceOptions.length > 0 ? referenceOptions.find(option => option.value === select) : null}
      options={referenceOptions}
      placeholder="Select a Spatial Reference..."
      onInputChange={(value) => setQuery(value)}
      onChange={onSelect}
      isLoading={isLoading}
      noOptionsMessage={
        ({inputValue}) => !inputValue
          ? "Please enter 2 or more characters"
          : "No spatial reference system found"
      }
    />
  );
}

SpatialDropdown.propTypes = {
  onSelect: PropTypes.func,
  select: PropTypes.string
};

export default SpatialDropdown;