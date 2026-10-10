import PeriodPicker from './PeriodPicker.component';

export default function YearPicker(props: {value:string;onChange:(value:string)=>void}) {
  return <PeriodPicker {...props} mode="year" />;
}
