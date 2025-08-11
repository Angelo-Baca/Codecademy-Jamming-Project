import React from 'react';

//This function component is for the searchbar of our application

function Searchbar() {
    return (
        <div className="Searchbar"> 
            <label htmlFor="searchInput">SearchBar</label>
            <input 
            id="searchInput" 
            type="text" 
            placeholder = "Enter the name of the song or artist you would like to search for"
            />
            <button>Search</button>
        </div>
        )
};

export default Searchbar