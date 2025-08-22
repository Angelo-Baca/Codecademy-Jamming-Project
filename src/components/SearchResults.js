import React from 'react';
import TrackList from './TrackList';

function SearchResults(props) {
  return (
    <div>
      <TrackList tracks={props.results} actionLabel="+" onAction={props.onAdd} />
    </div>
  );
}

export default SearchResults;
