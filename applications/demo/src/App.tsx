import { useState } from 'react';
// import { Button } from '@urrri/hi-mobx';
import logo from './logo.svg';
import './App.css';

type Params = { children: string; onClick: () => void };
function Button({ children, onClick }: Params): any {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>count is: {count}</p>
        <p>
          <Button onClick={() => setCount((value) => value + 1)}>Click here!</Button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  );
}

export default App;
