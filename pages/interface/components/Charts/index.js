import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { Box, useTheme } from '@/TabNewsUI';

export function BarChart({ title, data, yDataKey, name, fill = '#2da44e', xDataKey = 'date' }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Box>
      <h2>{title}</h2>
      <Box width="100%" height="140px">
        <ResponsiveContainer>
          <RechartsBarChart height={400} data={data}>
            <XAxis dataKey={xDataKey} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: colors.canvas.default }} />
            <Bar type="monotone" dataKey={yDataKey} name={name} fill={fill} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
