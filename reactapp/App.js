import ErrorBoundary from "react-tethys/components/error/ErrorBoundary";
import Loader from "react-tethys/components/loader/Loader";

import Project from "views/project/Project";
import AppContextProvider from "react-tethys/context";
import ProjectDataProvider from "services/ProjectDataProvider";
import { ToastContainer } from 'react-toastify';

import "App.scss";

function App() {
  return (
    <>
      <ToastContainer />
      <ErrorBoundary>
        <Loader>
          <AppContextProvider>
            <ProjectDataProvider>
              {(project, setProject) => (
                <Project project={project} setProject={setProject} />
              )}
            </ProjectDataProvider>
          </AppContextProvider>
        </Loader>
      </ErrorBoundary>
    </>
  );
}

export default App;
