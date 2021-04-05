import * as React from "react";
import * as opentype from "opentype.js";
import {parse} from "@math-blocks/opentype";

import type {Font} from "@math-blocks/opentype";

// TODO:
// draw bounding boxes around glyphs based on getMetrics() values

const getPath = (glyph: opentype.Glyph): string => {
    let result = "";

    // fontSize defaults to 72
    const path = glyph.getPath(0, 0, 72);

    // console.log(path.commands);

    for (const cmd of path.commands) {
        if (cmd.type === "M") {
            result += `M ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "L") {
            result += `L ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "C") {
            result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
        } else if (cmd.type === "Q") {
            result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
        } else {
            result += "Z";
        }
    }

    return result;
};

const lerp = (a: number, b: number, amount: number): number => {
    return amount * b + (1 - amount) * a;
};

const lerpPath = (
    path1: opentype.Path,
    path2: opentype.Path,
    amount: number,
): string => {
    const commands: opentype.PathCommand[] = [];

    for (let i = 0; i < path1.commands.length; i++) {
        const cmd1 = path1.commands[i];
        const cmd2 = path2.commands[i];

        if (cmd1.type === "M" && cmd2.type === "M") {
            commands.push({
                type: "M",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
            });
        } else if (cmd1.type === "L" && cmd2.type === "L") {
            commands.push({
                type: "L",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
            });
        } else if (cmd1.type === "C" && cmd2.type === "C") {
            commands.push({
                type: "C",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
                x1: lerp(cmd1.x1, cmd2.x1, amount),
                y1: lerp(cmd1.y1, cmd2.y1, amount),
                x2: lerp(cmd1.x2, cmd2.x2, amount),
                y2: lerp(cmd1.y2, cmd2.y2, amount),
            });
        } else if (cmd1.type === "Q" && cmd2.type === "Q") {
            commands.push({
                type: "Q",
                x: lerp(cmd1.x, cmd2.x, amount),
                y: lerp(cmd1.y, cmd2.y, amount),
                x1: lerp(cmd1.x1, cmd2.x1, amount),
                y1: lerp(cmd1.y1, cmd2.y1, amount),
            });
        } else if (cmd1.type === "Z" && cmd2.type === "Z") {
            commands.push({
                type: "Z",
            });
        } else {
            throw new Error("Command type mismatch");
        }
    }

    let result = "";

    for (const cmd of commands) {
        if (cmd.type === "M") {
            result += `M ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "L") {
            result += `L ${cmd.x},${cmd.y} `;
        } else if (cmd.type === "C") {
            result += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
        } else if (cmd.type === "Q") {
            result += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
        } else {
            result += "Z";
        }
    }

    return result;
};

const OpenTypeDemo: React.FC = () => {
    const [font, setFont] = React.useState<opentype.Font | null>(null);
    const [font2, setFont2] = React.useState<Font | null>(null);

    React.useEffect(() => {
        opentype.load("/STIX2Math.otf", (err, font) => {
            if (font) {
                console.log(font);
                const A = font.glyphs.get(3);
                console.log(A.getMetrics());
                setFont(font);
            }
        });

        parse("/STIX2Math.otf").then((font) => {
            console.log(font);
            setFont2(font);
        });
    }, []);

    if (font && font2) {
        const children = [];

        const glyphs = {
            LEFT_PAREN: {
                start: 1301,
                count: 11, // there's 12 but we're counting from 0
            },
            LEFT_BRACE: {
                start: 1349,
                count: 10, // there's actually 11 when counting from 0
            },
        };

        const count = glyphs.LEFT_BRACE.count;
        const start = glyphs.LEFT_BRACE.start;
        const end = start + count;

        for (let i = 0; i <= count; i++) {
            const d = getPath(font.glyphs.get(start + i));
            children.push(
                <path
                    key={start + i}
                    d={d}
                    transform={`translate(${i * 50}, 0)`}
                />,
            );
        }

        const lerpChildren = [];

        const d1 = font.glyphs.get(start);
        const d12 = font.glyphs.get(end);

        for (let i = 0; i <= count + 5; i++) {
            const d = lerpPath(d1.getPath(), d12.getPath(), i / count);
            lerpChildren.push(
                <path
                    key={start + i}
                    d={d}
                    transform={`translate(${i * 50}, 0)`}
                />,
            );
        }

        const surdChildren = [];

        const surd = font.glyphs.get(1657);
        const surd4 = font.glyphs.get(1660);

        // overshoot by twice
        for (let i = 0; i <= 12 + 12; i++) {
            const d = lerpPath(surd.getPath(), surd4.getPath(), i / 12);
            surdChildren.push(
                <path
                    key={start + i}
                    d={d}
                    transform={`translate(${i * 25}, 0)`}
                />,
            );
        }

        const intPath = lerpPath(
            font.glyphs.get(1701).getPath(),
            font.glyphs.get(1702).getPath(),
            0.5,
        );

        const parenLeftS2 = font2.getGlyph(1302);

        let parenPath = "";
        for (const cmd of parenLeftS2.path) {
            if (cmd.type === "M") {
                parenPath += `M ${cmd.x},${cmd.y} `;
            } else if (cmd.type === "L") {
                parenPath += `L ${cmd.x},${cmd.y} `;
            } else if (cmd.type === "C") {
                parenPath += `C ${cmd.x1},${cmd.y1} ${cmd.x2},${cmd.y2} ${cmd.x},${cmd.y}`;
            } else if (cmd.type === "Q") {
                parenPath += `Q ${cmd.x1},${cmd.y1} ${cmd.x},${cmd.y}`;
            } else {
                parenPath += "Z";
            }
        }

        console.log("parenleft.s2 = ", parenLeftS2);
        const fontSize = 60;
        const scale = fontSize / font2.head.unitsPerEm;

        return (
            <svg viewBox="0 0 1024 1024" width={1024} height={1024}>
                <g fill="currentcolor">
                    <path transform="translate(100, 150)" d={intPath} />
                    <path
                        transform="translate(150, 150)"
                        d={getPath(font.glyphs.get(3354))}
                    />
                    <path
                        transform="translate(200, 150)"
                        d={getPath(font.glyphs.get(3329))}
                    />
                    <path
                        transform="translate(250, 150)"
                        d={getPath(font.glyphs.get(1679))}
                    />
                    <g fill="blue" transform="translate(15, 512)">
                        {children}
                    </g>
                    <g fill="red" transform="translate(30, 512)">
                        {lerpChildren}
                    </g>
                    <g transform="translate(15, 800)">{surdChildren}</g>
                    <path
                        transform="translate(500, 1000)"
                        d={getPath(font.glyphs.get(1661))}
                    />
                    <path
                        transform="translate(500, 800)"
                        d={getPath(font.glyphs.get(1662))}
                    />
                    <path
                        transform="translate(500, 850)"
                        d={getPath(font.glyphs.get(1664))}
                    />
                    {/* uni221A.var is a variant for sqrt without overbar */}
                    <path
                        transform="translate(600, 1000)"
                        d={getPath(font.glyphs.get(1663))}
                    />
                    <path
                        transform={`translate(400, 125) scale(${scale}, ${scale})`}
                        d={parenPath}
                    />
                </g>
            </svg>
        );
    }

    return <h1>Loading font...</h1>;
};

export default OpenTypeDemo;
