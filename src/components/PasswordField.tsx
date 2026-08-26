"use client";

import { useId, useState } from "react";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  label?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  id,
  name = "password",
  value,
  onChange,
  autoComplete = "current-password",
  label = "Password",
  required = true,
  minLength = 8,
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-wave">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={inputId}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 pr-20 text-base outline-none ring-foam/40 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-2 my-auto h-9 px-2 text-sm font-semibold text-sea hover:underline"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
