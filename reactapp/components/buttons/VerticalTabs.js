import { Children, useEffect, useState } from 'react';
import styled from "styled-components";
import PropTypes from "prop-types";

const TabHeader = styled.div`
  position: sticky;
  top: 75px;
  width: 14vw;
`

const NavButton = styled.button`
  color: #000;
  &.active,
  &.show {
    color: #fff;
    background-color: var(--app-primary-color) !important;
  }
  &:hover {
    color: #000;
    background-color: var(--app-secondary-color);
  }
`;

const VerticalTabs = ({
  tabNames,
  children,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // This sets the earliest tab that actually has children to be the active tab.
    const allChildrenNull = Children.toArray(children[activeTab]).every(child => child === null);
    if (allChildrenNull) {
      setActiveTab(prevTab => prevTab + 1);
    }
  }, [activeTab, children]);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  return (
    <div className="d-flex align-items-start">
      <TabHeader
        className="nav flex-column nav-pills me-3"
        id="v-pills-tab"
        role="tablist"
        aria-orientation="vertical"
      >
        {tabNames.map((tabName, i) => {
          const allChildrenNull = Children.toArray(children[i]).every(child => child === null);
          return (
            !allChildrenNull && (
              <NavButton
                key={i}
                className={`nav-link ${activeTab === i ? 'active' : ''}`}
                onClick={() => handleTabClick(i)}
                id={`v-pills-${tabName.toLowerCase()}-tab`}
                data-bs-toggle="pill"
                data-bs-target={`#v-pills-${tabName.toLowerCase()}`}
                type="button"
                role="tab"
                aria-controls={`v-pills-${tabName.toLowerCase()}`}
                aria-selected={activeTab === i ? 'true' : 'false'}
              >
                {tabName}
              </NavButton>
            )
          );
        })}
      </TabHeader>
      <div className="tab-content" id="v-pills-tabContent" style={{width: "100%"}}>
        {tabNames.map((tabName, i) => {
          const allChildrenNull = Children.toArray(children[i]).every(child => child === null);          
          return (
            !allChildrenNull && (
              <div
                key={i}
                className={`tab-pane fade ${activeTab === i ? 'show active' : ''}`}
                id={`v-pills-${tabName.toLowerCase()}`}
                role="tabpanel"
                aria-labelledby={`v-pills-${tabName.toLowerCase()}-tab`}
              >
                {children[i]}
              </div>
            )
          );
        })}
      </div>
    </div>
  );
};

VerticalTabs.propTypes = {
  tabNames: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export default VerticalTabs;