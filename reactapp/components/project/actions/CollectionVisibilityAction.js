import { BsEyeFill, BsSlashLg } from "react-icons/bs";

import ToggleAction from "components/actions/ToggleAction";

const CollectionVisibilityAction = (props) => {
  return (
    <ToggleAction
      onTitle="Collection Visible"
      onIcon={
        <div style={{ maxWidth: "14px"}}>
          <BsEyeFill style={{ transform:"translate(-3px, 2px)" }}/>
          <BsEyeFill style={{ transform:"translate(-11px, -2px)" }}/>
        </div>
      }
      offTitle="Collection Hidden"
      offIcon={
        <div style={{ maxWidth: "14px"}}>
          <BsEyeFill style={{ transform:"translate(-3px, 2px)" }}/>
          <BsEyeFill style={{ transform:"translate(-11px, -2px)" }}/>
          <BsSlashLg strokeWidth={2} style={{ transform:"translate(-28px) scale(-1, 1)" }}/>
        </div>
      }
      {...props}
    />
  );
};

CollectionVisibilityAction.propTypes = {};

export default CollectionVisibilityAction;
