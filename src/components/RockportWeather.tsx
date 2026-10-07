import type { ReactNode } from "react";
import {
  formatCurrent,
  formatRain,
  formatWind,
  type RockportDay,
  type RockportForecast,
} from "@/lib/rockport-weather";

export async function RockportWeather({
  forecast,
}: {
  forecast: Promise<RockportForecast | null>;
}) {
  const data = await forecast;
  return <RockportWeatherPanel forecast={data} />;
}

export function RockportWeatherFallback() {
  return (
    <WeatherShell>
      <p className="mt-3 text-[1.05rem] text-wave/60" aria-live="polite">
        Loading the Cove Harbor forecast…
      </p>
    </WeatherShell>
  );
}

export function RockportWeatherPanel({
  forecast,
}: {
  forecast: RockportForecast | null;
}) {
  if (!forecast) {
    return (
      <WeatherShell>
        <p className="mt-3 text-[1.05rem] leading-relaxed text-wave/75 md:text-[1.125rem]">
          The Rockport forecast isn’t available right now. The schedule above
          still stands.
        </p>
      </WeatherShell>
    );
  }

  const current = forecast.current ? formatCurrent(forecast.current) : null;

  return (
    <WeatherShell>
      <p className="mt-3 max-w-3xl text-[1.05rem] leading-relaxed text-wave/80 md:text-[1.125rem]">
        {forecast.summary}
      </p>
      {current ? (
        <p className="mt-4 font-display text-[1.35rem] tracking-[0.03em] md:text-[1.75rem]">
          {current}
        </p>
      ) : null}
      <ul
        className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5"
        aria-label="Rockport daily forecast"
      >
        {forecast.days.map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </ul>
      <p className="mt-4 text-[0.85rem] text-wave/55">
        Weather data by{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sun underline-offset-2 hover:underline"
        >
          Open-Meteo
        </a>
        {" · "}
        {forecast.place}
        {" · "}
        America/Chicago
      </p>
    </WeatherShell>
  );
}

function DayCard({ day }: { day: RockportDay }) {
  const wind = formatWind(day.windMph, day.windDirection, day.windGustMph);
  const rain = formatRain(day.rainPercent, day.precipInches);

  return (
    <li
      className={`flex h-full flex-col border-2 p-3 max-sm:w-[min(18rem,78%)] max-sm:shrink-0 max-sm:snap-start ${
        day.highlighted ? "border-sun bg-salt" : "border-wave/15 bg-paper"
      }`}
    >
      <p className="font-label text-[0.8rem] tracking-[0.14em] text-sun">
        {day.weekday}
      </p>
      <p className="font-display text-[1.35rem] leading-none tracking-[0.03em]">
        {day.dateLabel}
      </p>
      {day.badge ? (
        <p className="mt-1 text-[0.95rem] leading-snug">
          {day.highlighted ? (
            <span className="text-sun" aria-hidden>
              ★{" "}
            </span>
          ) : null}
          {day.badge}
        </p>
      ) : null}
      {day.highF != null ? (
        <p className="mt-3 font-display text-[2rem] leading-none tracking-[0.02em]">
          {day.highF}°
          {day.lowF != null ? (
            <span className="ml-2 text-[1.15rem] text-wave/55">{day.lowF}°</span>
          ) : null}
        </p>
      ) : null}
      {day.highF != null ? (
        <p className="font-label mt-1 text-[0.72rem] tracking-[0.12em] text-wave/55">
          High{day.lowF != null ? ` · low ${day.lowF}°` : ""}
        </p>
      ) : null}
      {day.condition ? <p className="mt-2 text-[0.95rem]">{day.condition}</p> : null}
      {wind ? <p className="text-[0.95rem]">{wind}</p> : null}
      {rain ? <p className="text-[0.95rem]">{rain}</p> : null}
      {day.sunrise ? (
        <p className="mt-2 text-[0.95rem]">
          Sunrise {day.sunrise}
          {day.sunset ? (
            <>
              <br />
              Sunset {day.sunset}
            </>
          ) : null}
        </p>
      ) : null}
      <p className="mt-auto pt-2 font-label text-[0.7rem] tracking-[0.12em] text-wave/50">
        {day.windowLabel}
      </p>
    </li>
  );
}

function WeatherShell({ children }: { children: ReactNode }) {
  return (
    <section
      className="double-frame bg-paper p-5 md:p-7"
      aria-labelledby="rockport-weather"
    >
      <p className="font-label text-[0.95rem] tracking-[0.12em] text-sun md:text-[1.25rem]">
        Cove Harbor · Rockport, TX
      </p>
      <h2
        id="rockport-weather"
        className="font-display mt-1 border-b-2 border-sun pb-3 text-[1.375rem] tracking-[0.04em] md:text-[1.875rem]"
      >
        Rockport weather
      </h2>
      {children}
    </section>
  );
}
