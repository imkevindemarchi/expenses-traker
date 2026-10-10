import {useTranslation} from 'react-i18next';
import {useMoney} from '../contexts/currency.context';
import {Bar} from 'react-chartjs-2';
import {Chart as ChartJS,CategoryScale,LinearScale,BarElement,Tooltip,Legend,type ChartOptions} from 'chart.js';
import {useTheme} from '../hooks';
import {tr} from '../i18n';
import {INCOME_COLOR,EXPENSE_COLOR} from '../assets/constants/transaction-colors';
ChartJS.register(CategoryScale,LinearScale,BarElement,Tooltip,Legend);
export default function Histogram({labels,income,expense,label}:{labels:string[];income:number[];expense:number[];label:string}) {
 useTranslation();
  const money=useMoney();
 const {theme}=useTheme();const light=theme==='light';
 const options:ChartOptions<'bar'>={responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{legend:{position:'bottom',align:'start',labels:{color:light?'#3c3c3c':'#989797',boxWidth:9,boxHeight:9,padding:18,usePointStyle:true,pointStyle:'circle',font:{family:'Verdana, Geneva, Tahoma, sans-serif'}}},tooltip:{backgroundColor:light?'rgba(255,255,255,.97)':'rgba(24,24,24,.97)',titleColor:light?'#111111':'#ffffff',bodyColor:light?'#3c3c3c':'#e5e5e5',borderColor:'rgba(50,205,50,.3)',borderWidth:1,padding:12,callbacks:{label:context=>`${context.dataset.label}: ${money(context.parsed.y??0)}`}}},scales:{x:{stacked:false,grid:{display:false},border:{display:false},ticks:{color:light?'#737373':'#989797',maxRotation:0,autoSkip:true,maxTicksLimit:12}},y:{beginAtZero:true,border:{display:false},grid:{color:light?'rgba(0,0,0,.055)':'rgba(255,255,255,.055)'},ticks:{color:light?'#737373':'#989797',callback:value=>money(Number(value))}}}};
 return <div className="h-64 w-full sm:h-72 lg:h-80"><Bar role="img" aria-label={label} options={options} data={{labels,datasets:[{label:tr('Entrate'),data:income,backgroundColor:INCOME_COLOR,borderRadius:7,borderSkipped:false},{label:tr('Spese'),data:expense,backgroundColor:EXPENSE_COLOR,borderRadius:7,borderSkipped:false}]}}/></div>;
}
