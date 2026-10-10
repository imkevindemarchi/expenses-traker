import PeriodPicker from './PeriodPicker.component';

export default function MonthPicker(props: {value:string;onChange:(value:string)=>void}) {
  return <PeriodPicker {...props} mode="month" />;
}
