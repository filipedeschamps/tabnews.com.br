import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { useTheme } from '@/TabNewsUI';

import classes from './index.module.css';

export function BarChart({ title, data, yDataKey, name, fill = '#2da44e', xDataKey = 'date' }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <div>
      <h2>{title}</h2>
      <div className={classes.ChartArea}>
        <ResponsiveContainer initialDimension={{ width: 0, height: 140 }}>
          <RechartsBarChart height={400} data={data}>
            <XAxis dataKey={xDataKey} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: colors.canvas.default }} />
            <Bar type="monotone" dataKey={yDataKey} name={name} fill={fill} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
