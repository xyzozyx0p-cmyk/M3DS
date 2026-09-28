export function BlockIcon({ color, scale = 1 }: { color: string; scale?: number }) {
  return (
    <span
      className="block-icon"
      style={{ ["--block-color" as string]: color, ["--icon-scale" as string]: scale }}
      aria-hidden
    />
  );
}
