import { DynamicIcon } from 'lucide-react/dynamic';
import { Suspense } from 'react';

export type IconName = Parameters<typeof DynamicIcon>[0]['name'];

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const Icon = ({ name, size = 18, className }: IconProps) => (
  <Suspense fallback={<span style={{ width: size, height: size, display: 'inline-block' }} />}>
    <DynamicIcon name={name} size={size} className={className} />
  </Suspense>
);

export default Icon;