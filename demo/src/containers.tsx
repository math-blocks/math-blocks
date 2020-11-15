import * as React from "react";

type Props = {
    style?: React.CSSProperties;
    children: React.ReactNode;
};

export const HStack: React.SFC<Props> = (props) => {
    const style: React.CSSProperties = {
        ...props.style,
        display: "flex",
        flexDirection: "row",
    };

    return <div style={style}>{props.children}</div>;
};

export const VStack: React.SFC<Props> = (props) => {
    const style: React.CSSProperties = {
        ...props.style,
        display: "flex",
        flexDirection: "column",
    };

    return <div style={style}>{props.children}</div>;
};
