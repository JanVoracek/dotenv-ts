import * as t from 'io-ts';
import { fold, Either } from 'fp-ts/lib/Either';
import reporter from 'io-ts-reporters';
import { Errors } from 'io-ts';

type StringMap<T extends string> = Record<T, string>;

export type ProcessEnv<T extends readonly string[]> = StringMap<T[number]>;
export type Defaults<T extends readonly string[]> = Partial<ProcessEnv<T>>;

export function getEnv<T extends string>(variables: readonly T[], defaults: Partial<StringMap<T>> = {}): StringMap<T> {
  const objectEntries: [T, t.StringC][] = variables.map(name => [name, t.string]);
  const decoder = t.type(fromEntries(objectEntries));
  const result = decoder.decode({ ...defaults, ...process.env });
  return rightOrThrow('Invalid environment variables.', result);
}

function fromEntries<K extends string, V>(entries: [K, V][]): Record<K, V> {
  return Object.fromEntries(entries) as any;
}

function rightOrThrow<T>(message: string, either: Either<Errors, T>): T {
  return fold<Errors, T, T>(
    () => {
      const errors = reporter
        .report(either)
        .map(msg => `  ${msg}`)
        .join('\n');

      throw new Error(`${message}\n${errors}`);
    },
    it => it
  )(either);
}
