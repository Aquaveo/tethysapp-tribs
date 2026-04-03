import Button from "react-bootstrap/Button";
import { BsSave } from "react-icons/bs";
import PropTypes from "prop-types";

const SubmitButton = ({
  icon = <BsSave />,
  size = "sm",
  title = "Submit",
  variant = "outline-success",
  ...props
}) => {
  return (
    <Button
      type="submit"
      title={title}
      size={size}
      variant={variant}
      className="my-2 w-100"
      {...props}
    >
      {icon} {title}
    </Button>
  );
};

SubmitButton.propTypes = {
  icon: PropTypes.element,
  size: PropTypes.oneOf(["", "sm", "lg"]),
  title: PropTypes.string,
  variant: PropTypes.string,
};

export default SubmitButton;
