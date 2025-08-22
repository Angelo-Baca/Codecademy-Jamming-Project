import React from 'react';
import TrackList from './TrackList';

function Playlist(props) {
  function handleNameChange(event) {
    props.onNameChange(event.target.value);
  }

  return (
    <div>
      <input value={props.name} onChange={handleNameChange} aria-label="Playlist name" />
      <TrackList tracks={props.tracks} actionLabel="-" onAction={props.onRemove} />
      <button type="button" onClick={props.onSave}>Save to Spotify</button>
    </div>
  );
}

export default Playlist;
