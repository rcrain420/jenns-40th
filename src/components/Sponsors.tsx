import Image from "next/image";
import { SPONSORS } from "@/lib/sponsors";

export function Sponsors() {
  return (
    <section
      className="bg-salt px-5 py-8 md:px-11 md:py-11"
      aria-labelledby="sponsors-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="double-frame bg-paper p-5 md:p-7">
          <p className="font-label text-[0.95rem] tracking-[0.18em] text-sun md:text-[1.05rem]">
            Thank you
          </p>
          <h2
            id="sponsors-heading"
            className="mt-2 font-display border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]"
          >
            Sponsors
          </h2>

          <ul className="mt-6 flex flex-wrap justify-center gap-5">
            {SPONSORS.map((sponsor) => {
              const logo = (
                <Image
                  src={sponsor.logoSrc}
                  alt={`${sponsor.name} logo`}
                  width={sponsor.logoWidth}
                  height={sponsor.logoHeight}
                  className="h-auto w-full max-w-[16rem] object-contain"
                  sizes="(max-width: 640px) 70vw, 16rem"
                />
              );

              return (
                <li
                  key={sponsor.name}
                  className="flex min-h-[9rem] w-full max-w-[18rem] items-center justify-center border border-wave/20 bg-paper px-5 py-4"
                >
                  {sponsor.href ? (
                    <a
                      href={sponsor.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center transition hover:opacity-85"
                    >
                      {logo}
                    </a>
                  ) : (
                    logo
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
