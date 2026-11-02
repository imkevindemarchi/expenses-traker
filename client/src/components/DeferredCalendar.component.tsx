import { lazy, Suspense, type ComponentProps } from "react";
import type CalendarComponent from "react-calendar";
import { createPreloader } from "../utils/preload.util";
import { LoadingRegion, Shape } from "./LoadingShapes.component";

const loadCalendar = createPreloader(() => import("react-calendar"));
const Calendar = lazy(loadCalendar);

/** Reserve the current month's grid while the optional calendar code loads. */
function CalendarSkeleton({ date }: { date: Date }) {
  const year = date.getFullYear(),
    month = date.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return (
    <LoadingRegion layout="calendar">
      <div className="loading-calendar-navigation">
        <Shape width={40} height={40} />
        <Shape width="45%" height={20} />
        <Shape width={40} height={40} />
      </div>
      <div className="loading-calendar-weekdays">
        {Array.from({ length: 7 }, (_, i) => (
          <Shape key={i} width="60%" height={14} />
        ))}
      </div>
      <div className="loading-calendar-days">
        {Array.from({ length: cells }, (_, i) => (
          <div key={i}>
            <Shape width="60%" height={20} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export default function DeferredCalendar(props: ComponentProps<typeof CalendarComponent>) {
  return (
    <Suspense fallback={<CalendarSkeleton date={props.defaultActiveStartDate ?? new Date()} />}>
      <Calendar {...props} />
    </Suspense>
  );
}
