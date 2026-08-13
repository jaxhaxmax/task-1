'use client';

/**
 * BUILDER PASS — fields
 *
 * Six inputs, one screen, no wizard. The brief says one pass start to
 * finish; a numbered step flow is ceremony and two competitors shipped one.
 *
 * Copy rules followed here: labels name what the person controls, the
 * empty state is an invitation rather than an error, and the reroll button
 * says exactly what it does.
 */

import { useCallback, useMemo, useState } from 'react';
import { GLAZES, type GlazeKey } from '@/lib/builder-pass/tokens';
import { rollBuilderTitle, seedFrom, type Roll } from '@/lib/builder-pass/titles';
import { normaliseHandle } from '@/lib/builder-pass/draw';

export type BuilderPassFieldValues = {
  name: string;
  role: string;
  stack: string;
  github: string;
  linkedin: string;
  x: string;
};

export const EMPTY_FIELDS: BuilderPassFieldValues = {
  name: '',
  role: '',
  stack: '',
  github: '',
  linkedin: '',
  x: '',
};

/* ------------------------------------------------------------------ */
/* roll state                                                          */
/* ------------------------------------------------------------------ */

/**
 * Owns the reroll counter and derives the class from the fields.
 * Deterministic: the same inputs always produce the same class, so the
 * card doesn't reshuffle itself while someone is still typing their name.
 */
export function useBuilderPassRoll(values: BuilderPassFieldValues): Roll & {
  reroll: () => void;
  salt: number;
} {
  const [salt, setSalt] = useState(0);
  const seed = seedFrom(values);
  const roll = useMemo(() => rollBuilderTitle(seed, salt), [seed, salt]);
  const reroll = useCallback(() => setSalt((s) => s + 1), []);
  return { ...roll, reroll, salt };
}

/* ------------------------------------------------------------------ */
/* fields                                                              */
/* ------------------------------------------------------------------ */

type Props = {
  values: BuilderPassFieldValues;
  onChange: (next: BuilderPassFieldValues) => void;
  roll: Roll;
  onReroll: () => void;
};

export default function BuilderPassFields({ values, onChange, roll, onReroll }: Props) {
  const set = (key: keyof BuilderPassFieldValues) => (v: string) =>
    onChange({ ...values, [key]: v });

  // Paste a full profile URL, get a bare username. Nobody should have to
  // retype something already on their clipboard.
  const clean = (key: keyof BuilderPassFieldValues) => () =>
    onChange({ ...values, [key]: normaliseHandle(values[key]) });

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Name"
        hint="Goes on the plate, in caps"
        value={values.name}
        onChange={set('name')}
        placeholder="Dharm Patel"
        maxLength={28}
        autoComplete="name"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Role"
          value={values.role}
          onChange={set('role')}
          placeholder="full-stack developer"
          maxLength={42}
        />
        <Field
          label="Stack"
          value={values.stack}
          onChange={set('stack')}
          placeholder="react · node · next"
          maxLength={52}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="GitHub"
          prefix="gh/"
          value={values.github}
          onChange={set('github')}
          onBlur={clean('github')}
          placeholder="DDharm007"
          maxLength={39}
        />
        <Field
          label="LinkedIn"
          prefix="in/"
          value={values.linkedin}
          onChange={set('linkedin')}
          onBlur={clean('linkedin')}
          placeholder="dharm-patel"
          maxLength={60}
        />
        <Field
          label="X"
          prefix="x/"
          value={values.x}
          onChange={set('x')}
          onBlur={clean('x')}
          placeholder="dharmpatel"
          maxLength={39}
        />
      </div>

      <ClassReveal roll={roll} onReroll={onReroll} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* class reveal                                                        */
/* ------------------------------------------------------------------ */

function ClassReveal({ roll, onReroll }: { roll: Roll; onReroll: () => void }) {
  const g = GLAZES[roll.glaze];

  return (
    <div
      className="flex items-center gap-4 rounded-lg border p-4"
      style={{ borderColor: `${g.motif}33`, background: `${g.motif}0D` }}
    >
      <TileSwatch glaze={roll.glaze} />

      <div className="min-w-0 flex-1">
        <div
          className="font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: g.motif, opacity: 0.75 }}
        >
          Glaze · {g.label}
          {roll.glaze === 'OURO' ? ' · 3%' : ''}
        </div>
        <div
          className="truncate font-mono text-base font-bold sm:text-lg"
          style={{ color: g.motif }}
          title={roll.title}
        >
          {roll.title}
        </div>
      </div>

      <button
        type="button"
        onClick={onReroll}
        className="shrink-0 rounded-md px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        style={{ background: g.plate, color: g.plateText }}
      >
        Roll again
      </button>
    </div>
  );
}

/** The same quatrefoil that gets fired into the tile rail, at 40px. */
function TileSwatch({ glaze }: { glaze: GlazeKey }) {
  const g = GLAZES[glaze];
  return (
    <svg
      viewBox="0 0 100 100"
      width={44}
      height={44}
      aria-hidden="true"
      className="shrink-0 rounded-[3px]"
      style={{ background: '#F8F2E6' }}
    >
      <rect x="9" y="9" width="82" height="82" fill="none" stroke={g.motif} strokeOpacity="0.45" strokeWidth="1.5" />
      <g fill="none" stroke={g.motif} strokeOpacity="0.7" strokeWidth="3">
        <path d="M0 21 A21 21 0 0 0 21 0" />
        <path d="M79 0 A21 21 0 0 0 100 21" />
        <path d="M100 79 A21 21 0 0 0 79 100" />
        <path d="M21 100 A21 21 0 0 0 0 79" />
      </g>
      <g fill={g.motif} fillOpacity="0.86">
        <circle cx="50" cy="36" r="12" />
        <circle cx="64" cy="50" r="12" />
        <circle cx="50" cy="64" r="12" />
        <circle cx="36" cy="50" r="12" />
      </g>
      <circle cx="50" cy="50" r="5" fill={g.dot} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* input                                                               */
/* ------------------------------------------------------------------ */

function Field({
  label,
  hint,
  prefix,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  autoComplete,
}: {
  label: string;
  hint?: string;
  prefix?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  const id = `bp-${label.toLowerCase().replace(/\W+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase"
      >
        {label}
        {hint ? <span className="ml-2 font-normal tracking-normal normal-case opacity-70">{hint}</span> : null}
      </label>

      <div className="flex items-center rounded-md border border-neutral-300 bg-white focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10">
        {prefix ? (
          <span className="pl-3 font-mono text-base text-neutral-400 select-none">{prefix}</span>
        ) : null}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          spellCheck={false}
          // 16px minimum: anything smaller makes iOS Safari zoom the page
          // on focus, which reads as the app breaking.
          className="w-full bg-transparent px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
        />
      </div>
    </div>
  );
}
