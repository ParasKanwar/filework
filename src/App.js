import routes from "./routes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map(({ path, component }, i) => (
          <Route path={path} element={component} key={i} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
