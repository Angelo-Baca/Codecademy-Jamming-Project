import logo from './logo.svg';
import './App.css';

function App() {
  // Sanity check for rendering
  console.log("✅ App render at", new Date().toLocaleString());


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <h1 style={{ padding: 24 }}>Jammming app boot OK!</h1>
    </div>
  );
}

export default App;
