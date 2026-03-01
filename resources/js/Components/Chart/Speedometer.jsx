import { Pie, PieChart, Tooltip } from 'recharts';


const DEFAULT_DATA = [
  { name: 'A', value: 80, fill: '#ff0000' },
  { name: 'B', value: 45, fill: '#00ff00' },
  { name: 'C', value: 25, fill: '#0000ff' },
];

const DEFAULT_NEEDLE_BASE_RADIUS = 5;
const DEFAULT_NEEDLE_COLOR = '#d0d000';

const Needle = ({ cx, cy, innerRadius, outerRadius, angle, needleColor, needleBaseRadius }) => {
  const needleLength = innerRadius + (outerRadius - innerRadius) / 2;
  const rad = (angle * Math.PI) / 180;
  const x = cx - needleLength * Math.cos(rad);
  const y = cy - needleLength * Math.sin(rad);

  return (
    <g>
      <circle cx={cx} cy={cy} r={needleBaseRadius} fill={needleColor} stroke="none" />
      <line
        x1={cx} y1={cy}
        x2={x} y2={y}
        strokeWidth={2}
        stroke={needleColor}
      />
    </g>
  );
};

const HalfPie = ({ data, cx, cy, innerRadius, outerRadius, isAnimationActive }) => (
  <Pie
    stroke="none"
    dataKey="value"
    startAngle={180}
    endAngle={0}
    data={data}
    cx={cx}
    cy={cy}
    innerRadius={innerRadius}
    outerRadius={outerRadius}
    isAnimationActive={isAnimationActive}
  />
);

function valueToAngle(value, data) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  // return (value / total) * 180;
  return (value / total) * 180;
}

/**
 * A half-pie "gauge" chart with a needle indicator.
 *
 * Props:
 *   data            - Array of { name, value, fill } objects (default: sample RGB data)
 *   cx              - Horizontal center of the pie (default: 100)
 *   cy              - Vertical center of the pie (default: 100)
 *   innerRadius     - Inner radius in px (default: 50)
 *   outerRadius     - Outer radius in px (default: 100)
 *   width           - Chart width in px (default: 210)
 *   height          - Chart height in px (default: 120)
 *   needleColor     - CSS color string for the needle (default: '#d0d000')
 *   needleBaseRadius - Radius of the needle base circle in px (default: 5)
 *   isAnimationActive - Whether to animate the pie (default: true)
 *   showTooltip     - Whether to render the Tooltip (default: false)
 */
export default function PieChartWithNeedle({
  data = DEFAULT_DATA,
  cx = 100,
  cy = 100,
  innerRadius = 50,
  outerRadius = 100,
  needleValue = 0,
  width = 210,
  height = 120,
  needleColor = DEFAULT_NEEDLE_COLOR,
  needleBaseRadius = DEFAULT_NEEDLE_BASE_RADIUS,
  isAnimationActive = true,
  showTooltip = false,
}) {
  const angle = valueToAngle(needleValue ?? data[0].value, data);
  const bringBackDownNeedleALittle = 4;
  const NeedleCustomized = () => (
    <Needle
      cx={cx} cy={cy + bringBackDownNeedleALittle}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      angle={angle}
      needleColor={needleColor}
      needleBaseRadius={needleBaseRadius}
    />
  );

  const sharedPieProps = { data, innerRadius, outerRadius, isAnimationActive, cy };

  return (
    <PieChart width={width} height={height}>
      <HalfPie {...sharedPieProps} />
      <NeedleCustomized />
    </PieChart>
  );
}