import Svg, { Path } from 'react-native-svg';

type ChevronProps = {
  size?: number;
  color: string;
};

/**
 * Единственный локальный глиф-шеврон главной. Тот же путь, что
 * `shared/icons/ChevronRightIcon.svg`, но с управляемым цветом — там `stroke`
 * захардкожен в файле, а главная красит шеврон DS-токеном (accent-400/onAction).
 */
export function Chevron({ size = 18, color }: ChevronProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.417 20L15.004 13.413C15.375 13.036 15.583 12.529 15.583 12C15.583 11.471 15.375 10.964 15.004 10.587L8.417 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
