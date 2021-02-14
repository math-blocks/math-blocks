import * as types from "../types";
import * as builders from "../builders";

export const row = (str: string): types.Row =>
    builders.row(
        str.split("").map((glyph) => {
            if (glyph === "-") {
                return builders.glyph("\u2212");
            }
            return builders.glyph(glyph);
        }),
    );

export const frac = (num: string, den: string): types.Frac =>
    builders.frac(
        num.split("").map((glyph) => builders.glyph(glyph)),
        den.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sqrt = (radicand: string): types.Root =>
    builders.root(
        null,
        radicand.split("").map((glyph) => builders.glyph(glyph)),
    );

export const root = (index: string | null, radicand: string): types.Root =>
    builders.root(
        index ? index.split("").map((glyph) => builders.glyph(glyph)) : null,
        radicand.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sup = (sup: string): types.SubSup =>
    builders.subsup(
        undefined,
        sup.split("").map((glyph) => builders.glyph(glyph)),
    );

export const sub = (sub: string): types.SubSup =>
    builders.subsup(
        sub.split("").map((glyph) => builders.glyph(glyph)),
        undefined,
    );

export const subsup = (sub: string | null, sup: string | null): types.SubSup =>
    builders.subsup(
        sub ? sub.split("").map((glyph) => builders.glyph(glyph)) : undefined,
        sup ? sup.split("").map((glyph) => builders.glyph(glyph)) : undefined,
    );
