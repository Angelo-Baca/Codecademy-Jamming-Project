import React from 'react';

function Track(props) {
    const name = props.name;
    const artist = props.artist;
    const album = props.album;
    const featured = props.featured;


    return (
        <div className = "Track">
            <h3 id='name'>The name of of this song is {name}</h3>
            <p id="trackinfo">The artist is {artist} <br />
                The track has feated artist(s) {featured} <br />
                It is part of the album, {album}.
            </p>
        </div>
    );
}

export default Track