import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 120, className, variant = "default" }: Props & { variant?: "default" | "white" }) {
  return (
    <Image
      src={variant === "white" ? "/logo-white.png" : "/logo.png"}
      alt="codeKids"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}

export function LogoMark({ size = 36, className }: Props) {
  return <Logo size={size} className={className} />;
}

export function LogoWhite({ size = 120, className }: Props) {
  return <Logo size={size} className={className} />;
}

export function LogoDark({ size = 120, className }: Props) {
  return <Logo size={size} className={className} />;
}
