import React from 'react';
import PropTypes from 'prop-types';

// This function component is for the searchbar of our application
function Searchbar(props) {
  // Handles user typing; reports the value up to the parent
  function handleInputChange(event) {
    props.onChange(event.target.value);
  }

  // Handles the form submit; trims and prevents empty searches
  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = (props.value || '').trim();
    if (trimmed.length === 0) {
      return;
    }
    props.onSearch(trimmed);
  }

  // Need a return statement for all JSX and want to have a return form be outside element
  return (
    <form
      className="Searchbar"
      onSubmit={handleSubmit}
      role="search"
      aria-label="Artist or song search"
    >
      <label htmlFor="searchInput">Search</label>

      <input
        id="searchInput"
        type="text"
        placeholder="Enter the name of the song or artist you would like to search for"
        value={props.value}
        onChange={handleInputChange}
        aria-describedby="searchHelp"
      />

      <div id="searchHelp" hidden>
        Please press Enter or click the search button.
      </div>

      <button type="submit" disabled={props.isLoading}>
        {props.isLoading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}

Searchbar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

Searchbar.defaultProps = {
  isLoading: false,
};

export default Searchbar;

