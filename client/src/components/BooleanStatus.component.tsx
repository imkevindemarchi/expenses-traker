import { type FC } from "react";
import { Ban, CircleCheck } from "lucide-react";

interface IProps {
  value: boolean;
}

const BooleanStatus: FC<IProps> = ({ value }) => {
  return value ? (
    <CircleCheck className="text-success" size={18} strokeWidth={2} />
  ) : (
    <Ban className="text-danger" size={18} strokeWidth={2} />
  );
};

export default BooleanStatus;
