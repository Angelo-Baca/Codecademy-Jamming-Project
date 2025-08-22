import React from 'react';

function Track(props) {
  const { name, artist, album, featured } = props;

  return (
    <div className="Track">
      <h3 id="name">The name of this song is {name}</h3>
      <p id="trackinfo">
        The artist is {artist} <br />
        {featured ? <>Featured artist(s): {featured} <br /></> : null}
        It is part of the album, {album}.
      </p>
    </div>
  );
}

export default Track;
