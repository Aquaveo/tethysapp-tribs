import PropTypes from "prop-types";
import { useState, useEffect, useContext } from "react";

import { AppContext } from 'react-tethys/context';


const ProjectDataProvider = ({children}) => {
    const [project, setProject] = useState(null);
    const {backend} = useContext(AppContext);

    useEffect(() => {
        // Bind to PROJECT_DATA received from the backend
        backend.on(backend.actions.PROJECT_DATA, (data) => {
            setProject(data);
        });

        // Send PROJECT_DATA request to the backend
        backend.do(backend.actions.PROJECT_DATA, {initial: true});
    }, [backend]);

    return project ? children(project, setProject) : null;
}

ProjectDataProvider.propTypes = {
    children: PropTypes.func.isRequired,
};

export default ProjectDataProvider;