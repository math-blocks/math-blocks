import {traverse} from "../traverse";
import * as Types from "../types";

describe("traverse", () => {
    it("call enter and exit once for a single node", () => {
        const num: Types.Num = {
            id: 0,
            type: "number",
            value: "123",
        };
        const enter = jest.fn();
        const exit = jest.fn();

        traverse(num, enter, exit);

        expect(enter).toHaveBeenCalledTimes(1);
        expect(enter).toHaveBeenCalledWith(num);
        expect(exit).toHaveBeenCalledTimes(1);
        expect(exit).toHaveBeenCalledWith(num);
    });

    it("should traverse arrays", () => {
        const add: Types.Add = {
            id: 0,
            type: "add",
            args: [
                {
                    id: 1,
                    type: "number",
                    value: "123",
                },
                {
                    id: 2,
                    type: "number",
                    value: "456",
                },
            ],
        };
        const cb = jest.fn();

        traverse(add, cb);

        expect(cb).toHaveBeenCalledTimes(3);
        expect(cb).toHaveBeenCalledWith(add);
        expect(cb).toHaveBeenCalledWith(add.args[0]);
        expect(cb).toHaveBeenCalledWith(add.args[1]);
    });

    it("call traverse properties", () => {
        const power: Types.Pow = {
            id: 0,
            type: "pow",
            base: {
                id: 1,
                type: "identifier",
                name: "x",
            },
            exp: {
                id: 2,
                type: "number",
                value: "3",
            },
        };
        const cb = jest.fn();

        traverse(power, cb);

        expect(cb).toHaveBeenCalledTimes(3);
        expect(cb).toHaveBeenCalledWith(power);
        expect(cb).toHaveBeenCalledWith(power.base);
        expect(cb).toHaveBeenCalledWith(power.exp);
    });

    it("should not call cb on location", () => {
        const num: Types.Num = {
            id: 0,
            type: "number",
            value: "123",
            location: {
                path: [],
                prev: 1,
                next: 2,
            },
        };
        const cb = jest.fn();

        traverse(num, cb);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(num);
    });
});
