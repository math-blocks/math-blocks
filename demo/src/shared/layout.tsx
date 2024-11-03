import * as React from 'react';

type Props = {
  readonly style?: React.CSSProperties;
  readonly children: React.ReactNode;
};

export const HStack: React.FunctionComponent<Props> = (props) => {
  const style: React.CSSProperties = {
    ...props.style,
    display: 'flex',
    flexDirection: 'row',
  };

  return <div style={style}>{props.children}</div>;
};

export const VStack: React.FunctionComponent<Props> = (props) => {
  const style: React.CSSProperties = {
    ...props.style,
    display: 'flex',
    flexDirection: 'column',
  };

  return <div style={style}>{props.children}</div>;
};
