import React, { useState } from "react";
import './App.css';
import Searchbar from "./components/Searchbar";
import SearchResults from "./components/SearchResults";
import Playlist from "./components/Playlist";
import Spotify from './Spotify';

function App() {
  console.log("✅ App render at", new Date().toLocaleString());
  console.log("Using redirectUri:", "http://127.0.0.1:3000/");
  console.log("Client ID:", "bf4fb0235ccc46fc80c7c5ae1dde6afb");

  // ----- State -----
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([
    // You can keep these mocks for initial render; real results will replace them after first search.
    { id: 1, name: "Superstition", artist: "Stevie Wonder", album: "Talking Book", uri: "uri1" },
    { id: 2, name: "Billie Jean", artist: "Michael Jackson", album: "Thriller", uri: "uri2" }
  ]);
  const [playlistName, setPlaylistName] = useState('New Playlist');
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ----- Handlers -----
  async function handleSearch(term) {
    try {
      Spotify.search(term).then(results => setSearchResults(results));
      setIsLoading(true);
      console.log(`Searching Spotify for: ${term}`);
      const results = await Spotify.search(term);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function addTrack(track) {
    const exists = playlistTracks.find(t => t.id === track.id);
    if (!exists) {
      setPlaylistTracks(prev => [...prev, track]);
    }
  }

  function removeTrack(track) {
    setPlaylistTracks(prev => prev.filter(t => t.id !== track.id));
  }

  async function savePlaylist() {
    const uris = playlistTracks.map(t => t.uri);
    Spotify.savePlaylist(playlistName, playlistTracks.map(t => t.uri))
  .then(() => {
    setPlaylistName('New Playlist');
    setPlaylistTracks([]);
  });

    if (!uris.length) {
      console.log('No tracks to save.');
      return;
    }
    try {
      setIsLoading(true);
      await Spotify.savePlaylist(playlistName, uris);
      setPlaylistName('New Playlist');
      setPlaylistTracks([]);
      console.log('Playlist saved!');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='App'>
      <h1>Jamming</h1>

      <Searchbar
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      <h2>Search Results:</h2>
      <SearchResults
        results={searchResults}
        onAdd={addTrack}
      />

      <h2>Playlist:</h2>
      <Playlist
        name={playlistName}
        tracks={playlistTracks}
        onNameChange={setPlaylistName}
        onRemove={removeTrack}
        onSave={savePlaylist}
        // disabled={isLoading} // optional UX
      />
    </div>
  );
}

export default App;
