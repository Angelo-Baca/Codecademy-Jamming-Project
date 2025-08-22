import React from 'react';
import Track from './Track';

function TrackList(props) {
  if (!props.tracks || props.tracks.length === 0) {
    return <div className="TrackList--empty">No tracks to display.</div>;
  }

  function handleActionClick(track) {
    if (typeof props.onAction === 'function') {
      props.onAction(track);
    }
  }

  return (
    <div className="TrackList">
      {props.tracks.map(function (t) {
        const key = t.id != null ? t.id : (t.uri || (t.name + t.artist + t.album));

        return (
          <div className="TrackList-row" key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Track name={t.name} artist={t.artist} album={t.album} />
            <button
              type="button"
              aria-label={props.actionLabel === '+' ? 'Add track' : 'Remove track'}
              onClick={function () { handleActionClick(t); }}
            >
              {props.actionLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default TrackList;
