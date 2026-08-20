import Image from "next/image";
import type { BrandConfig } from "@/brands/types";

export function AvaVisual({ brand }: { brand: BrandConfig }) {
  const image = brand.images.heroScene ?? brand.images.ava;

  return (
    <div className="relative h-[48vh] min-h-[280px] w-full md:h-[52vh] lg:h-[58vh] xl:h-[65vh]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_18%] md:object-[center_22%] xl:object-[center_24%]"
      />
    </div>
  );
}
