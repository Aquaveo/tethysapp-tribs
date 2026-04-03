import PropTypes from "prop-types";
import { useState, useContext, useEffect } from "react";
import { AppContext } from "react-tethys/context";
import { Tab, Tabs, Form, InputGroup } from "react-bootstrap";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from "styled-components";

import SettingsModal from "../../dialogs/SettingsModal";
import * as workflowConstants from "constants/workflowConstants"
import RunAction from "../actions/RunAction";
import TreeItem from "components/tree/TreeItem";
import HistoryTreeItem from "../tree-items/HistoryTreeItem";
import Icon from "assets/Icon";

import GenericFolder from 'assets/Generic_Folder.svg';
import ToolWrench from 'assets/Tool_item.svg';
import { BsSearch } from "react-icons/bs";
import { matchesUUID } from "components/tree/propTypes";

const StyledTabs = styled(Tabs)`
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 5;
  padding-top: 1rem;
  & > * {
    & :hover {
      color: #000;
      background-color: var(--app-secondary-color);
    }
    & > * {
      color: #000;
      &.active,
      &.show {
        color: #fff !important;
        background-color: var(--app-primary-color) !important;
      }
    }
  }
`;

function setUpFilteredWorkflows(allWorkflows, searchTerm = "") {
  const filtered = {};
  if (searchTerm.length === 0) {
    Object.entries(allWorkflows).forEach(([groupName, workflows]) => {
      filtered[groupName] = workflows;
    })

    return filtered;
  }

  Object.entries(allWorkflows).forEach(([groupName, workflows]) => {
    const filteredWorkflows = workflows.filter((workflow) =>
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredWorkflows.length > 0) {
      filtered[groupName] = filteredWorkflows;
    }
  });
  return filtered;
}

function setupHistoryItems(workflows) {
  return workflows?.history.reduce((historyItems, workflow) => {
    const date = new Date(Date.parse(workflow.date_created)).toLocaleDateString(undefined, { timeZone: "UTC" });
    if (!historyItems[date]) {
      historyItems[date] = [];
    }
    historyItems[date] = [workflow, ...historyItems[date]];
    return historyItems;
  }, {});
}

function findHistoryItemDateAndIndex(historyItems, newHistoryItem) {
  for (let date in historyItems) {
    const index = historyItems[date].findIndex(obj => obj.id === newHistoryItem.id);
    if (index !== -1) {
      return { date, index };
    }
  }
  return { date: null, index: null };
}

const WorkflowsModal = ({
  workflows,
  title,
  show = false,
  onClose,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState("workflows");

  const { backend } = useContext(AppContext);
  useEffect(() => {
    if (show) {
      backend.do(backend.actions.WORKFLOW_DATA_ALL, {initial: true})
    }
  }, [backend, show]);

  const [allWorkflows, setAllWorkflows] = useState([]);
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);

  const [workflowLoaded, setWorkflowLoaded] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState("");

  const [workflowFilter, setWorkflowFilter] = useState("");
  const [filteredWorkflows, setFilteredWorkflows] = useState([]);

  useEffect(() => {
    if(workflows.available) {
      setAllWorkflows(
        workflows?.available.reduce((acc, group) => {
          acc[group.name] = group.workflows;
          return acc;
        }, {})
      );
      setAvailableWorkflows(workflows.available);
    }

    if (workflows.history) {
      setHistoryItems(setupHistoryItems(workflows));
    }
  }, [backend, workflows]);

  useEffect(() => {
    setFilteredWorkflows(setUpFilteredWorkflows(allWorkflows));
  }, [allWorkflows]);

  useEffect(() => {
    if (workflowLoaded) {
      setTimeout(() => {
        window.open(newWorkflow.url, "_self", "noopener noreferrer");
      }, 2500);
    }
    setWorkflowLoaded(false);
  }, [newWorkflow, workflowLoaded]);

  const updateHistory = (historyItem) => {
    const { index, date } = findHistoryItemDateAndIndex(historyItems, historyItem);
    if (index !== null) {
      // Used for Renaming existing History Items
      const newHistoryItems = {...historyItems};
      const newHistoryDateArray = [...newHistoryItems[date]];
      newHistoryDateArray[index] = historyItem;
      newHistoryItems[date] = newHistoryDateArray;
      setHistoryItems(newHistoryItems);
    } else {
      let newHistoryItems = {...historyItems};
      const newHistoryItemDate = new Date(historyItem.date_created).toLocaleDateString(undefined, { timeZone: "UTC" });
      if (!newHistoryItems[newHistoryItemDate]) {
        newHistoryItems = {[newHistoryItemDate]: [], ...historyItems};
      }
      newHistoryItems[newHistoryItemDate].push(historyItem);

      setHistoryItems(newHistoryItems);
    }
  };

  backend.on(backend.actions.WORKFLOW_DATA, (historyItem) => {
    const { index } = findHistoryItemDateAndIndex(historyItems, historyItem);
    if (index === null) {
      setNewWorkflow(historyItem);
      updateHistory(historyItem);
      setWorkflowLoaded(true);
    } else {
      // Used for Renaming existing History Items
      updateHistory(historyItem);
    }
  });

  const handleClose = () => {
    onClose && onClose();
  };

  const runWorkflow = (workflow) => {
    const { index } = findHistoryItemDateAndIndex(historyItems, workflow);
    if (index !== null) {
      window.open(workflow.url, "_self", "noopener noreferrer");
    } else {
      toast.info("Opening Workflow Window", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      });
      backend.do(backend.actions.WORKFLOW_CREATE, {type: workflow.type});
      setActiveTab("history");
    }
  };

  const handleUpdateHistory = (historyItem) => {
    backend.do(backend.actions.WORKFLOW_UPDATE, historyItem)
  };

  const handleDeleteHistory = (historyItemId) => {
    backend.do(backend.actions.WORKFLOW_DELETE, {id: historyItemId})
  };

  backend.on(backend.actions.WORKFLOW_DELETE, (data) => {
    const { index, date } = findHistoryItemDateAndIndex(historyItems, data);
    if (index !== null) {
      const newHistoryItems = {...historyItems};
      const newHistoryDateArray = newHistoryItems[date].filter((historyItem) => historyItem.id !== data.id);
      if (newHistoryDateArray.length === 0) {
        delete newHistoryItems[date];
      } else {
        newHistoryItems[date] = newHistoryDateArray;
      }
      setHistoryItems(newHistoryItems);
    }
  });

  const handleDuplicateHistory = (historyItemId) => {
    toast.info("Opening Workflow Window", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
    });
    backend.do(backend.actions.WORKFLOW_DUPLICATE, {id: historyItemId})
  };

  const handleFilterChange = (event) => {
    const searchTerm = event.target.value
    setWorkflowFilter(searchTerm);
    filterWorkflowsByName(searchTerm);
  };

  const filterWorkflowsByName = (searchTerm) => {
    setFilteredWorkflows(setUpFilteredWorkflows(allWorkflows, searchTerm));
  };

  return (
    <SettingsModal title={title} show={show} onClose={handleClose} {...props}>
      <StyledTabs
        id="file-tabs"
        className="mb-3"
        activeKey={activeTab}
        onSelect={(activeKey) => setActiveTab(activeKey)}
      >
        <Tab eventKey="workflows" title="Workflows">
          <InputGroup>
            <InputGroup.Text id="basic-addon1"><BsSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search Workflows"
              value={workflowFilter}
              onChange={handleFilterChange}
            />
          </InputGroup>
          {availableWorkflows.map((workflow_group) => (
            <TreeItem
              key={`workflow-group-${workflow_group.name}`}
              title={workflow_group.name}
              icon={<Icon src={GenericFolder} altText="Folder" />}
            >
              {filteredWorkflows && Object.keys(filteredWorkflows).map((groupName) => (
                filteredWorkflows[groupName] &&
                groupName === workflow_group.name &&
                filteredWorkflows[groupName].map((workflow, workflowIndex) => (
                  <TreeItem
                    key={`workflow-${workflowIndex}`}
                    title={workflow.name}
                    altTitle={workflow.description}
                    leaf
                    icon={<Icon src={ToolWrench} altText="Workflow" />}
                    style={{backgroundColor: workflowIndex % 2 === 1 ? "var(--app-secondary-color)" : "unset"}}
                    defaultOpen
                    actions={[
                      <RunAction
                        key="workflow-run-action"
                        title={`Run ${workflow.name}`}
                        onClick={() => runWorkflow(workflow)}
                        inline
                      />
                    ]}
                  />
                ))
              ))}
            </TreeItem>
          ))}
        </Tab>
        <Tab eventKey="history" title="History">
          {Object.entries(historyItems).map(([date, workflow]) => (
            <TreeItem
              key={`history-date-${date}`}
              title={date}
              icon={<Icon src={GenericFolder} altText="Folder" />}
              defaultOpen
            >
              {workflow.map((history_item, i) => {
                if (history_item) {
                  return (
                    <HistoryTreeItem
                      key={`history-item-${history_item.name}`}
                      historyIndex={i}
                      historyItem={history_item}
                      onDelete={handleDeleteHistory}
                      onDuplicate={handleDuplicateHistory}
                      onUpdate={handleUpdateHistory}
                      runWorkflow={runWorkflow}
                    />
                  );
                } else {
                  return null;
                }
              }).reverse()}
            </TreeItem>
          ))}
        </Tab>
      </StyledTabs>
    </SettingsModal>
  );
};

WorkflowsModal.propTypes = {
  workflows: PropTypes.shape({
    available: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        workflows: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string,
            description: PropTypes.string,
            type: PropTypes.string,
          })
        )
      }
    )),
    history: PropTypes.arrayOf(
      PropTypes.shape({
        id: matchesUUID,
        name: PropTypes.string,
        date_created: PropTypes.instanceOf(Date),
        status: PropTypes.oneOf(workflowConstants.WORKFLOW_STATUS),
        steps: PropTypes.array,
        output: PropTypes.array,
      })
    )
  }),
  title: PropTypes.string,
  onClose: PropTypes.func,
  show: PropTypes.bool,
};

export default WorkflowsModal;

