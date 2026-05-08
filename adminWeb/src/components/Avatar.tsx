import { getInitials } from '../utils/format';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
}

export function Avatar({ name, src, size = 36 }: AvatarProps) {
  const dimension = `${size}px`;
  const fontSize = Math.max(11, Math.round(size * 0.4));

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className="avatar"
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  return (
    <span
      className="avatar avatar-fallback"
      style={{ width: dimension, height: dimension, fontSize }}
    >
      {getInitials(name)}
    </span>
  );
}
