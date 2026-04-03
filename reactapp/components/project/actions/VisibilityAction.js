import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";

import ToggleAction from "components/actions/ToggleAction";

const VisibilityAction = (props) => {
  return (
    <ToggleAction
      onTitle="Visible"
      onIcon={<BsEyeFill />}
      offTitle="Hidden"
      offIcon={<BsEyeSlashFill />}
      {...props}
    />
  );
};

VisibilityAction.propTypes = {};

export default VisibilityAction;
