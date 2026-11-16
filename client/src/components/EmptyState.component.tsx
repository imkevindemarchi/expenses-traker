import type { FC, ReactNode } from "react";

/** iOS empty list: tinted icon, title, one line of help. */
const EmptyState: FC<{ icon: ReactNode; title: string; text?: string }> = ({
  icon,
  title,
  text,
}) => (
  <div className="ios-empty" role="status">
    <span className="ios-empty__icon" aria-hidden="true">
      {icon}
    </span>
    <p className="ios-empty__title">{title}</p>
    {text && <p className="ios-empty__text">{text}</p>}
  </div>
);

export default EmptyState;
